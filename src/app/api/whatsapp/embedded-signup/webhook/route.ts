import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { updateAccountFromWebhook } from "@/lib/whatsapp-embedded-resolver";

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

/**
 * Handle embedded signup events from Meta webhook
 * This is the authoritative signal that signup is complete
 */
async function handleEmbeddedSignupEvent(event: any) {
    try {
        console.log("Embedded Signup Event:", JSON.stringify(event, null, 2));

        // Event types: embedded_signup_completed, embedded_signup_failed
        if (event.event === "embedded_signup_completed") {
            const { waba_id, phone_number_id, access_token, user_id } = event;

            if (!waba_id || !phone_number_id) {
                console.error("Missing WABA ID or Phone Number ID in signup event");
                return;
            }

            // Try to find and update existing account (covers PENDING accounts)
            const updatedFromWebhook = await updateAccountFromWebhook({
                wabaId: waba_id,
                phoneNumberId: phone_number_id,
                accessToken: access_token,
                userId: user_id ? parseInt(user_id) : undefined,
            });

            if (updatedFromWebhook) {
                console.log(`Webhook successfully updated existing account with WABA=${waba_id}`);
                return;
            }

            // No existing account found, create new one
            // Find user by email or use user_id from event
            const userId = user_id ? parseInt(user_id) : null;

            if (!userId) {
                console.error("Could not determine user ID from event and no existing account found");
                return;
            }

            // Get phone number details
            let phoneNumber = null;
            if (access_token) {
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
            }

            // Create or update WhatsApp account as ACTIVE
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
                    status: "ACTIVE",
                },
                create: {
                    userId,
                    wabaId: waba_id,
                    phoneNumberId: phone_number_id,
                    accessToken: access_token,
                    phoneNumber: phoneNumber || undefined,
                    apiVersion: "v22.0",
                    isActive: true,
                    status: "ACTIVE",
                },
            });

            // Allocate initial credits (only for new accounts)
            const INITIAL_CREDITS = parseFloat(process.env.EMBEDDED_SIGNUP_INITIAL_CREDITS || "100");
            if (INITIAL_CREDITS > 0) {
                // Check if credits were already allocated (avoid double allocation)
                const existingTransaction = await prisma.walletTransaction.findFirst({
                    where: {
                        messageId: { startsWith: `embedded_signup_${account.id}_` }
                    }
                });

                if (!existingTransaction) {
                    await prisma.user.update({
                        where: { id: userId },
                        data: {
                            walletBalance: { increment: INITIAL_CREDITS },
                        },
                    });

                    await prisma.walletTransaction.create({
                        data: {
                            userId,
                            amount: INITIAL_CREDITS,
                            type: "TOPUP",
                            messageId: `embedded_signup_webhook_${account.id}_${Date.now()}`,
                        },
                    });
                }
            }

            console.log(`Successfully processed embedded signup for user ${userId}, account ${account.id}`);
        } else if (event.event === "embedded_signup_failed") {
            console.error("Embedded signup failed:", event);
            // Optionally update account status to ERROR
            // For now, we leave it in PENDING state as retry might still work
        }
    } catch (error: any) {
        console.error("Error handling embedded signup event:", error);
    }
}
