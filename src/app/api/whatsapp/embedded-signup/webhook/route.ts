import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "your_verify_token_here";
const APP_SECRET = process.env.META_APP_SECRET || "";

/**
 * Webhook endpoint for WhatsApp Embedded Signup events
 * Handles signup completion notifications from Meta
 */
export async function GET(req: NextRequest) {
    // Webhook verification (required by Meta)
    const mode = req.nextUrl.searchParams.get("hub.mode");
    const token = req.nextUrl.searchParams.get("hub.verify_token");
    const challenge = req.nextUrl.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
        console.log("Webhook verified");
        return new NextResponse(challenge, { status: 200 });
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/**
 * Handle webhook events from Meta
 */
export async function POST(req: NextRequest) {
    try {
        // Verify webhook signature
        const signature = req.headers.get("x-hub-signature-256");
        if (!signature) {
            return NextResponse.json({ error: "Missing signature" }, { status: 401 });
        }

        const body = await req.text();
        const expectedSignature = `sha256=${crypto
            .createHmac("sha256", APP_SECRET)
            .update(body)
            .digest("hex")}`;

        if (signature !== expectedSignature) {
            console.error("Invalid webhook signature");
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }

        const data = JSON.parse(body);

        // Handle different event types
        if (data.object === "whatsapp_business_account") {
            for (const entry of data.entry || []) {
                for (const change of entry.changes || []) {
                    if (change.field === "embedded_signup") {
                        await handleEmbeddedSignupEvent(change.value);
                    }
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Webhook processing error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function handleEmbeddedSignupEvent(event: any) {
    try {
        console.log("Embedded Signup Event:", event);

        // Event types: embedded_signup_completed, embedded_signup_failed
        if (event.event === "embedded_signup_completed") {
            const { waba_id, phone_number_id, access_token, user_id } = event;

            if (!waba_id || !phone_number_id || !access_token) {
                console.error("Missing required fields in signup event");
                return;
            }

            // Find user by email or create account mapping
            // Note: You may need to adjust this based on how you map Meta users to your users
            const userId = user_id ? parseInt(user_id) : null;

            if (!userId) {
                console.error("Could not determine user ID from event");
                return;
            }

            // Get phone number details
            let phoneNumber = null;
            try {
                const phoneResponse = await fetch(
                    `https://graph.facebook.com/v22.0/${phone_number_id}?access_token=${access_token}`,
                    { method: "GET" }
                );
                const phoneData = await phoneResponse.json();
                phoneNumber = phoneData.display_phone_number || phoneData.verified_name;
            } catch (error) {
                console.error("Failed to fetch phone number:", error);
            }

            // Create or update WhatsApp account
            const account = await prisma.whatsAppAccount.upsert({
                where: {
                    userId_phoneNumberId: {
                        userId,
                        phoneNumberId: phone_number_id,
                    },
                },
                update: {
                    accessToken: access_token,
                    wabaId: waba_id,
                    phoneNumber: phoneNumber || undefined,
                    isActive: true,
                },
                create: {
                    userId,
                    wabaId: waba_id,
                    phoneNumberId: phone_number_id,
                    accessToken: access_token,
                    phoneNumber: phoneNumber || undefined,
                    apiVersion: "v22.0",
                    isActive: true,
                },
            });

            // Allocate initial credits
            const INITIAL_CREDITS = parseFloat(process.env.EMBEDDED_SIGNUP_INITIAL_CREDITS || "100");
            if (INITIAL_CREDITS > 0) {
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        walletBalance: { increment: INITIAL_CREDITS },
                    },
                });

                // Record transaction
                await prisma.walletTransaction.create({
                    data: {
                        userId,
                        amount: INITIAL_CREDITS,
                        type: "TOPUP",
                        messageId: `embedded_signup_webhook_${account.id}_${Date.now()}`,
                    },
                });
            }

            console.log(`Successfully processed embedded signup for user ${userId}, account ${account.id}`);
        }
    } catch (error: any) {
        console.error("Error handling embedded signup event:", error);
    }
}
