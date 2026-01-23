// Path: Src/app/api/wa/webhook/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === process.env.WA_VERIFY_TOKEN) {
      return new Response(challenge || "", { status: 200 });
    }

    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  } catch (err) {
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[WA webhook] payload:", JSON.stringify(body));

    // Meta shape: body.entry[0].changes[0].value
    const changes = body.entry?.[0]?.changes?.[0]?.value;
    if (!changes) return NextResponse.json({ status: "nochange" });

    const messages = changes.messages;
    if (messages && messages.length > 0) {
      const msg = messages[0];
      const fromPhone = msg.from; // e.g. "9198xxxxxx"
      const text = msg.text?.body ?? (msg?.interactive?.button_reply?.title ?? "") ?? null;
      const waMessageId = msg.id;

      // find contact by phone (stored as digits). Try exact match, else try variations
      const digits = fromPhone.replace(/\D/g, "");
      let contact = await prisma.contact.findFirst({ where: { phone: { contains: digits } } });

      // If not found, create contact assigned to DEFAULT_USER_ID (env) so messages have owner
      const defaultUserId = Number(process.env.DEFAULT_USER_ID || 1);
      if (!contact) {
        contact = await prisma.contact.create({
          data: {
            phone: digits,
            name: `WhatsApp ${digits.slice(-6)}`,
            source: "WhatsApp",
            userId: defaultUserId,
            wabaPhone: process.env.WA_PHONE_NUMBER_ID ?? null,
          }
        });
      }

      // create message under contact.userId
      await prisma.message.create({
        data: {
          contactId: contact.id,
          userId: contact.userId,
          content: text ?? "",
          sentBy: "contact",
          from: digits,
          text: text ?? "",
          senderId: msg.from,
          receiverId: String(contact.id),
          seen: false,
        }
      });

      // Optionally update contact.updatedAt and last message summary
      await prisma.contact.update({
        where: { id: contact.id },
        data: { updatedAt: new Date() },
      });

      return NextResponse.json({ status: "stored" });
    }

    // Handle status updates (delivered, read, failed)
    const statuses = changes.statuses;
    if (statuses && statuses.length) {
      console.log("[WA webhook] status events:", statuses);

      for (const statusUpdate of statuses) {
        const waMessageId = statusUpdate.id;
        const newStatus = statusUpdate.status; // "delivered", "read", "failed", "sent"

        try {
          // Find message by WhatsApp message ID
          const message = await prisma.message.findFirst({
            where: { whatsappMessageId: waMessageId },
            include: { campaign: true }
          });

          if (!message) {
            console.log(`[WA webhook] Message not found for ID: ${waMessageId}`);
            continue;
          }

          // Only update if new status is "better" than current
          // Status progression: sent -> delivered -> read
          const shouldUpdate =
            (message.status === "sent" && (newStatus === "delivered" || newStatus === "read")) ||
            (message.status === "delivered" && newStatus === "read") ||
            (newStatus === "failed");

          if (!shouldUpdate) {
            console.log(`[WA webhook] Skipping status update: ${message.status} -> ${newStatus}`);
            continue;
          }

          // Update message status
          await prisma.message.update({
            where: { id: message.id },
            data: { status: newStatus }
          });

          console.log(`[WA webhook] ✅ Updated message ${message.id} status: ${message.status} -> ${newStatus}`);

          // Update campaign stats if this message is part of a campaign
          if (message.campaignId) {
            const campaign = await prisma.campaign.findUnique({
              where: { id: message.campaignId }
            });

            if (campaign) {
              // Count all messages for this campaign by status
              const messageCounts = await prisma.message.groupBy({
                by: ['status'],
                where: { campaignId: message.campaignId },
                _count: { status: true }
              });

              const stats = {
                sentCount: 0,
                deliveredCount: 0,
                readCount: 0,
                failedCount: 0
              };

              messageCounts.forEach(group => {
                if (group.status === 'sent') stats.sentCount = group._count.status;
                if (group.status === 'delivered') stats.deliveredCount = group._count.status;
                if (group.status === 'read') stats.readCount = group._count.status;
                if (group.status === 'failed') stats.failedCount = group._count.status;
              });

              // Update campaign stats
              await prisma.campaign.update({
                where: { id: message.campaignId },
                data: {
                  sentCount: stats.sentCount,
                  deliveredCount: stats.deliveredCount,
                  failedCount: stats.failedCount,
                  readCount: stats.readCount
                }
              });

              console.log(`[WA webhook] ✅ Updated campaign ${message.campaignId} stats:`, stats);
            }
          }
        } catch (err) {
          console.error(`[WA webhook] Error processing status update for ${waMessageId}:`, err);
        }
      }

      return NextResponse.json({ status: "status_processed" });
    }

    return NextResponse.json({ status: "ignored" });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
