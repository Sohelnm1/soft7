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
        // ============================================
        // EMBEDDED SIGNUP WEBHOOK LOGGING
        // Log all incoming webhook events for debugging
        // ============================================
        console.log("\n");
        console.log("*".repeat(80));
        console.log("[EMBEDDED SIGNUP WEBHOOK RECEIVED]", new Date().toISOString());
        console.log("Endpoint: /api/whatsapp/embedded-signup/webhook");

        // Verify webhook signature
        const signature = req.headers.get("x-hub-signature-256");
        console.log("Signature Present:", !!signature);

        if (!signature) {
            console.log("❌ Missing signature - rejecting request");
            return NextResponse.json({ error: "Missing signature" }, { status: 401 });
        }

        const body = await req.text();
        console.log("Raw Body Length:", body.length);

        const expectedSignature = `sha256=${crypto
            .createHmac("sha256", APP_SECRET)
            .update(body)
            .digest("hex")}`;

        if (signature !== expectedSignature) {
            console.error("❌ Invalid webhook signature");
            console.log("Received:", signature.substring(0, 30) + "...");
            console.log("Expected:", expectedSignature.substring(0, 30) + "...");
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }
        console.log("✅ Signature verified successfully");

        const data = JSON.parse(body);
        console.log("Object Type:", data.object);
        console.log("Full Payload:", JSON.stringify(data, null, 2));

        // Log each entry and change
        if (data.entry && Array.isArray(data.entry)) {
            data.entry.forEach((entry: any, entryIndex: number) => {
                console.log(`\n--- Entry ${entryIndex} ---`);
                console.log("Entry ID:", entry.id);

                if (entry.changes && Array.isArray(entry.changes)) {
                    entry.changes.forEach((change: any, changeIndex: number) => {
                        console.log(`\n  [Change ${changeIndex}]`);
                        console.log("  Field:", change.field);
                        console.log("  Value:", JSON.stringify(change.value, null, 4));

                        // Specifically log embedded signup related fields
                        if (change.field === "embedded_signup") {
                            console.log("\n  🔔 EMBEDDED_SIGNUP FIELD DETECTED!");
                            console.log("  Event Type:", change.value?.event);
                            console.log("  WABA ID:", change.value?.waba_id);
                            console.log("  Phone Number ID:", change.value?.phone_number_id);
                            console.log("  Access Token Present:", !!change.value?.access_token);
                            console.log("  User ID:", change.value?.user_id);
                        }

                        if (change.field === "account_update") {
                            console.log("\n  🔔 ACCOUNT_UPDATE FIELD DETECTED!");
                            console.log("  Event:", change.value?.event);
                            console.log("  WABA Info:", JSON.stringify(change.value?.waba_info, null, 4));
                            console.log("  Phone Info:", JSON.stringify(change.value?.phone_info, null, 4));
                        }
                    });
                }
            });
        }
        console.log("*".repeat(80));
        console.log("\n");

        // Handle different event types
        if (data.object === "whatsapp_business_account") {
            for (const entry of data.entry || []) {
                for (const change of entry.changes || []) {
                    // Handle both embedded_signup and account_update fields
                    if (change.field === "embedded_signup") {
                        await handleEmbeddedSignupEvent(change.value);
                    }
                    // Also handle account_update with PARTNER_ADDED (Meta's actual embedded signup notification)
                    if (change.field === "account_update" && change.value?.event === "PARTNER_ADDED") {
                        console.log("📥 Processing account_update PARTNER_ADDED event...");
                        await handleAccountUpdatePartnerAdded(entry, change.value);
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

/**
 * Handle account_update webhook with PARTNER_ADDED event
 * Meta sends this when a customer completes embedded signup (not the embedded_signup field)
 */
async function handleAccountUpdatePartnerAdded(entry: any, value: any) {
    try {
        const wabaId = value?.waba_info?.waba_id;
        const ownerBusinessId = value?.waba_info?.owner_business_id;
        const phoneInfo = value?.phone_info;

        console.log("[Embedded Signup Webhook] PARTNER_ADDED event received:");
        console.log("  WABA ID:", wabaId);
        console.log("  Owner Business ID:", ownerBusinessId);
        console.log("  Phone Info:", JSON.stringify(phoneInfo, null, 2));

        if (!wabaId) {
            console.log("No WABA ID in PARTNER_ADDED event, cannot update account");
            return;
        }

        // Try to find and update existing PENDING account by WABA ID
        const existing = await prisma.whatsAppAccount.findFirst({
            where: { wabaId },
        });

        if (existing) {
            // Update with phone number info if available
            const phoneNumberId = phoneInfo?.phone_number_id;
            const phoneNumber = phoneInfo?.display_phone_number;

            await prisma.whatsAppAccount.update({
                where: { id: existing.id },
                data: {
                    isActive: true,
                    status: "ACTIVE",
                    ...(phoneNumberId && { phoneNumberId }),
                    ...(phoneNumber && { phoneNumber }),
                },
            });

            console.log(`✅ [Webhook] Updated existing account ${existing.id} for WABA ${wabaId} to ACTIVE`);
        } else {
            // Try to update pending account via resolver
            const updated = await updateAccountFromWebhook({
                wabaId,
                phoneNumberId: phoneInfo?.phone_number_id,
            });

            if (updated) {
                console.log(`✅ [Webhook] Updated pending account via resolver for WABA ${wabaId}`);
            } else {
                console.log(`⚠️ [Webhook] No existing account found for WABA ${wabaId}`);
            }
        }
    } catch (error: any) {
        console.error("Error handling account_update PARTNER_ADDED:", error);
    }
}
