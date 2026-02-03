// Path: Src/app/api/wa/webhook/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publishSocketEvent } from "@/lib/socket-bridge";

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
      const waMessageId = msg.id;

      // Extract message type and content
      const messageType = msg.type; // text, image, video, audio, document, sticker, etc.
      let text = msg.text?.body ?? (msg?.interactive?.button_reply?.title ?? "") ?? null;
      let mediaUrl: string | null = null;
      let mimeType: string | null = null;
      let mediaId: string | null = null;
      let fileName: string | null = null;

      // Handle media messages
      if (messageType === 'image' && msg.image) {
        mediaId = msg.image.id;
        mimeType = msg.image.mime_type;
        text = msg.image.caption || '[IMAGE]';
      } else if (messageType === 'video' && msg.video) {
        mediaId = msg.video.id;
        mimeType = msg.video.mime_type;
        text = msg.video.caption || '[VIDEO]';
      } else if (messageType === 'audio' && msg.audio) {
        mediaId = msg.audio.id;
        mimeType = msg.audio.mime_type;
        text = '[AUDIO]';
      } else if (messageType === 'document' && msg.document) {
        mediaId = msg.document.id;
        mimeType = msg.document.mime_type;
        fileName = msg.document.filename || 'document';
        text = msg.document.caption || `[DOCUMENT: ${fileName}]`;
      } else if (messageType === 'sticker' && msg.sticker) {
        mediaId = msg.sticker.id;
        mimeType = msg.sticker.mime_type;
        text = '[STICKER]';
      }

      const metadata = changes.metadata;
      const phoneNumberId = metadata?.phone_number_id;

      // Identify target user by looking up the WhatsApp account
      let targetUserId = Number(process.env.DEFAULT_USER_ID || 1);
      let accessToken = process.env.WA_ACCESS_TOKEN;

      if (phoneNumberId) {
        const account = await prisma.whatsAppAccount.findFirst({
          where: { phoneNumberId: phoneNumberId }
        });
        if (account) {
          targetUserId = account.userId;
          accessToken = account.accessToken || accessToken;
        }
      }

      // Download media if present
      if (mediaId && accessToken) {
        try {
          // Step 1: Get media URL from WhatsApp
          const mediaInfoRes = await fetch(`https://graph.facebook.com/v21.0/${mediaId}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const mediaInfo = await mediaInfoRes.json();

          if (mediaInfo.url) {
            // Step 2: Download media content
            const mediaRes = await fetch(mediaInfo.url, {
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            const mediaBuffer = Buffer.from(await mediaRes.arrayBuffer());

            // Step 3: Save to local uploads
            const fs = await import('fs');
            const path = await import('path');
            const uploadsDir = path.default.join(process.cwd(), 'public', 'uploads');
            if (!fs.existsSync(uploadsDir)) {
              fs.mkdirSync(uploadsDir, { recursive: true });
            }

            // Generate filename
            const ext = mimeType?.split('/')[1]?.split(';')[0] || 'bin';
            const uniqueFileName = `${Date.now()}_incoming_${waMessageId.slice(-8)}.${ext}`;
            const localFilePath = path.default.join(uploadsDir, uniqueFileName);

            fs.writeFileSync(localFilePath, mediaBuffer);
            mediaUrl = `/uploads/${uniqueFileName}`;

            console.log(`[WA webhook] Media saved: ${mediaUrl}`);
          }
        } catch (mediaError) {
          console.error('[WA webhook] Failed to download media:', mediaError);
        }
      }

      // find contact by phone (stored as digits) for this specific user
      const digits = fromPhone.replace(/\D/g, "");
      let contact = await prisma.contact.findFirst({
        where: {
          phone: { contains: digits },
          userId: targetUserId
        }
      });

      // If not found, create contact assigned to the identified user
      if (!contact) {
        // Try to get the profile name from the payload
        const profileName = changes.contacts?.[0]?.profile?.name;

        contact = await prisma.contact.create({
          data: {
            phone: digits,
            name: profileName || `WhatsApp ${digits.slice(-6)}`,
            source: "WhatsApp",
            userId: targetUserId,
            wabaPhone: phoneNumberId || process.env.WA_PHONE_NUMBER_ID || null,
          }
        });
      }

      // Ensure a conversation exists for this user and phone
      let conversation = await prisma.conversation.findUnique({
        where: {
          userId_phone: {
            userId: targetUserId,
            phone: digits
          }
        }
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            userId: targetUserId,
            phone: digits,
            contactId: contact.id,
            name: contact.name
          }
        });
      }

      // create message under contact.userId (which is now correctly targetUserId)
      const newMessage = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          contactId: contact.id,
          userId: targetUserId,
          content: text ?? "",
          sentBy: "contact",
          from: digits,
          text: text ?? "",
          senderId: msg.from,
          receiverId: String(contact.id),
          seen: false,
          direction: "incoming",
          status: "delivered", // incoming messages are delivered
          whatsappMessageId: waMessageId,
          messageType: messageType !== 'text' ? messageType : null,
          mediaUrl: mediaUrl,
          mediaType: mimeType,
        }
      });

      // Emit socket event for real-time update via Redis bridge
      await publishSocketEvent("new_message", {
        id: newMessage.id,
        contactId: contact.id,
        userId: targetUserId,
        text: text ?? "",
        direction: "incoming",
        status: "delivered",
        createdAt: newMessage.createdAt.toISOString(),
        whatsappMessageId: waMessageId,
        messageType: messageType !== 'text' ? messageType : null,
        mediaUrl: mediaUrl,
        mediaType: mimeType,
        contactName: contact.name,
        contactPhone: digits,
      });
      console.log("[WA webhook] 📤 Published new_message event for contact:", contact.id);

      // Optionally update contact.updatedAt and conversation
      await prisma.contact.update({
        where: { id: contact.id },
        data: { updatedAt: new Date() },
      });

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastInboundAt: new Date(),
          updatedAt: new Date()
        },
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

          // Emit socket event for real-time status update via Redis bridge
          await publishSocketEvent("message_status_update", { wamid: waMessageId, status: newStatus });
          console.log(`[WA webhook] 📤 Published message_status_update: ${waMessageId} -> ${newStatus}`);

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
