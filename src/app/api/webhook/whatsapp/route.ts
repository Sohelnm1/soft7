import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enqueueWebhook } from "@/queues/webhook.queue";

/* =========================
   VERIFY WEBHOOK (GET)
   (Kept as is for Meta verification)
========================= */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token) {
    if (token === process.env.WA_VERIFY_TOKEN) {
      return new NextResponse(challenge, { status: 200 });
    }
    const account = await prisma.whatsAppAccount.findFirst({
      where: { verifyToken: token },
    });
    if (account) {
      return new NextResponse(challenge, { status: 200 });
    }
  }
  return new NextResponse("Forbidden", { status: 403 });
}

/* =========================
   RECEIVE WEBHOOK (POST)
   Fast Ingest Mode: Enqueue job for background processing
========================= */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ============================================
    // EMBEDDED SIGNUP WEBHOOK LOGGING
    // Log all incoming webhook events to debug what Meta sends
    // ============================================
    console.log("=".repeat(80));
    console.log("[WEBHOOK RECEIVED]", new Date().toISOString());
    console.log("Object Type:", body.object);
    console.log("Full Payload:", JSON.stringify(body, null, 2));

    // Log each entry and change
    if (body.entry && Array.isArray(body.entry)) {
      body.entry.forEach((entry: any, entryIndex: number) => {
        console.log(`\n--- Entry ${entryIndex} ---`);
        console.log("Entry ID:", entry.id);

        if (entry.changes && Array.isArray(entry.changes)) {
          entry.changes.forEach((change: any, changeIndex: number) => {
            console.log(`\n  [Change ${changeIndex}]`);
            console.log("  Field:", change.field);
            console.log("  Value:", JSON.stringify(change.value, null, 4));

            // Specifically log embedded signup related fields
            if (change.field === "embedded_signup") {
              console.log("\n  🔔 EMBEDDED SIGNUP EVENT DETECTED!");
              console.log("  Event Type:", change.value?.event);
              console.log("  WABA ID:", change.value?.waba_id);
              console.log("  Phone Number ID:", change.value?.phone_number_id);
              console.log("  Access Token Present:", !!change.value?.access_token);
            }

            if (change.field === "account_update") {
              console.log("\n  🔔 ACCOUNT UPDATE EVENT DETECTED!");
              console.log("  Event:", change.value?.event);
              console.log("  WABA Info:", JSON.stringify(change.value?.waba_info, null, 4));
              console.log("  Phone Info:", JSON.stringify(change.value?.phone_info, null, 4));
            }

            if (change.field === "phone_number_quality_update") {
              console.log("\n  📱 PHONE NUMBER QUALITY UPDATE DETECTED!");
            }

            if (change.field === "account_alerts") {
              console.log("\n  ⚠️ ACCOUNT ALERTS DETECTED!");
            }

            if (change.field === "message_template_status_update") {
              console.log("\n  📝 TEMPLATE STATUS UPDATE DETECTED!");
            }
          });
        }
      });
    }
    console.log("=".repeat(80));

    // Check if this is an embedded signup related event (handle immediately, don't queue)
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const field = change?.field;
    const value = change?.value;

    // Meta sends embedded signup events as account_update with various event types:
    // - PARTNER_APP_INSTALLED: When app is installed on WABA (has waba_id)
    // - PARTNER_ADDED: When partner relationship is established
    // (There is no "embedded_signup" webhook field in the dashboard - subscribe to account_update)
    if (field === "embedded_signup") {
      await handleEmbeddedSignupWebhook(value);
      return NextResponse.json({ status: "accepted" });
    }

    // Handle account_update events for embedded signup
    if (field === "account_update") {
      const eventType = value?.event;

      // PARTNER_APP_INSTALLED - This is the main event we receive during embedded signup
      // It contains waba_id in waba_info
      if (eventType === "PARTNER_APP_INSTALLED" || eventType === "PARTNER_ADDED") {
        console.log(`📥 Processing account_update ${eventType} event...`);
        await handleAccountUpdatePartnerEvent(entry, value);
        return NextResponse.json({ status: "accepted" });
      }
    }

    // 1️⃣ Fast Ingest: Extract Meta ID for Queue Idempotency
    const metaId =
      value?.messages?.[0]?.id ||
      value?.statuses?.[0]?.id ||
      `wh_${Date.now()}`;

    // 2️⃣ Record raw payload to DB
    const log = await prisma.incomingWebhook.create({
      data: {
        payload: body,
        status: "PENDING",
      },
    });

    // 3️⃣ Enqueue for async processing
    // Deterministic metaId ensures BullMQ drops duplicate retries within the same backoff window
    await enqueueWebhook(metaId, log.id, body);

    // 4️⃣ Return 200 OK Immediately (<100ms goal)
    return NextResponse.json({ status: "accepted", id: log.id });
  } catch (error: any) {
    console.error("WhatsApp Webhook Ingest Error:", error.message);
    // Return 200 to Meta to avoid retries if the payload was received but processing enqueued
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 200 },
    );
  }
}

async function handleEmbeddedSignupWebhook(event: any) {
  try {
    console.log("Embedded Signup Webhook Event:", event);

    // Event types: embedded_signup_completed, embedded_signup_failed
    if (event.event === "embedded_signup_completed") {
      const { waba_id, phone_number_id, access_token } = event;

      if (!waba_id || !phone_number_id || !access_token) {
        console.error("Missing required fields in signup event");
        return;
      }

      // Get phone number details
      let phoneNumber = null;
      try {
        const phoneResponse = await fetch(
          `https://graph.facebook.com/v22.0/${phone_number_id}?access_token=${access_token}`,
          { method: "GET" },
        );
        const phoneData = await phoneResponse.json();
        phoneNumber = phoneData.display_phone_number || phoneData.verified_name;
      } catch (error) {
        console.error("Failed to fetch phone number:", error);
      }

      // For embedded signup, we need to find or create a user
      // Option 1: Create a default user account for embedded signup customers
      // Option 2: Map to an existing user based on email/phone if available
      // For now, we'll create accounts under a default user or find by phone

      const defaultUserId = Number(process.env.DEFAULT_USER_ID || 1);

      // Try to find existing user by phone number if available
      let userId = defaultUserId;
      if (phoneNumber) {
        const existingUser = await prisma.user.findFirst({
          where: { phone: { contains: phoneNumber.replace(/\D/g, "") } },
        });
        if (existingUser) {
          userId = existingUser.id;
        }
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
      const INITIAL_CREDITS = parseFloat(
        process.env.EMBEDDED_SIGNUP_INITIAL_CREDITS || "100",
      );
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

      console.log(
        `✅ Successfully processed embedded signup for user ${userId}, account ${account.id}`,
      );
    }
  } catch (error: any) {
    console.error("Error handling embedded signup webhook:", error);
  }
}

/** Meta sends embedded signup events as account_update with PARTNER_APP_INSTALLED or PARTNER_ADDED. */
async function handleAccountUpdatePartnerEvent(entry: any, value: any) {
  try {
    const eventType = value?.event;
    const wabaId = value?.waba_info?.waba_id;
    const ownerBusinessId = value?.waba_info?.owner_business_id;

    console.log(`[Webhook] Processing ${eventType}:`, {
      wabaId,
      ownerBusinessId,
    });

    if (!wabaId) {
      console.log("[Webhook] No WABA ID in event, skipping");
      return;
    }

    // First, try to find existing account by wabaId
    let account = await prisma.whatsAppAccount.findFirst({
      where: { wabaId },
    });

    if (account) {
      // Account already exists with this WABA ID, activate it
      await prisma.whatsAppAccount.update({
        where: { id: account.id },
        data: { isActive: true, status: "ACTIVE" },
      });
      console.log(`✅ [Webhook] Activated existing account ${account.id} for WABA ${wabaId}`);
      return;
    }

    // No account with this WABA ID - look for pending accounts to update
    // Find the most recent pending account (created during OAuth callback)
    const pendingAccount = await prisma.whatsAppAccount.findFirst({
      where: {
        status: "PENDING_EMBEDDED_SIGNUP",
        wabaId: null, // Account without WABA ID
      },
      orderBy: { createdAt: "desc" },
    });

    if (pendingAccount) {
      // Update the pending account with the WABA ID from webhook
      await prisma.whatsAppAccount.update({
        where: { id: pendingAccount.id },
        data: {
          wabaId,
        },
      });
      console.log(`[Webhook] Updated pending account ${pendingAccount.id} with WABA ${wabaId}`);

      // Now try to fetch phone numbers using the account's access token
      if (pendingAccount.accessToken) {
        try {
          console.log(`[Webhook] Fetching phone numbers for WABA ${wabaId}...`);
          const phonesResponse = await fetch(
            `https://graph.facebook.com/v22.0/${wabaId}/phone_numbers?access_token=${encodeURIComponent(pendingAccount.accessToken)}`,
            { method: "GET" }
          );
          const phonesData = await phonesResponse.json();
          console.log(`[Webhook] Phone numbers response:`, JSON.stringify(phonesData, null, 2));

          if (phonesData.data && phonesData.data.length > 0) {
            const firstPhone = phonesData.data[0];
            await prisma.whatsAppAccount.update({
              where: { id: pendingAccount.id },
              data: {
                phoneNumberId: firstPhone.id,
                phoneNumber: firstPhone.display_phone_number || firstPhone.verified_name,
                isActive: true,
                status: "ACTIVE",
              },
            });
            console.log(`✅ [Webhook] Account ${pendingAccount.id} fully resolved: WABA=${wabaId}, Phone=${firstPhone.id} -> ACTIVE`);
            return;
          } else {
            console.log(`[Webhook] No phone numbers found yet for WABA ${wabaId}, leaving account in partially resolved state`);
            // Leave account with WABA ID but still pending phone resolution
          }
        } catch (phoneError) {
          console.error(`[Webhook] Error fetching phone numbers:`, phoneError);
        }
      }

      return;
    }

    console.log(`⚠️ [Webhook] No pending account found to update for WABA ${wabaId}`);
  } catch (error: any) {
    console.error("Error handling account_update event:", error);
  }
}
