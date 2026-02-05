import type { Prisma } from "@prisma/client";
const { prisma } = require("../lib/prisma.worker.cjs");
import { WalletService } from "./wallet.service";
import { publishSocketEvent } from "../lib/socket-bridge";

/**
 * Normalizes a phone number by removing non-numeric characters
 * and ensuring it doesn't have a leading + or 00.
 */
function normalizePhone(phone: string): string {
  if (!phone) return phone;
  // Remove all non-digits
  return phone.replace(/\D/g, "");
}

export class MessageService {
  /**
   * Updates the status of a message and triggers wallet deduction if needed.
   */
  static async handleStatusUpdate(wamid: string, status: string, details: any) {
    const { timestamp, errorCode, errorMessage } = details;

    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Find message and campaign
      const message = await tx.message.findUnique({
        where: { whatsappMessageId: wamid },
        select: {
          id: true,
          userId: true,
          campaignId: true,
          reminderId: true,
          status: true,
          ...({ deliveredAt: true } as any),
        },
      });

      if (!message) {
        console.warn(
          `[MessageService] Message ${wamid} not found in database.`,
        );
        return null;
      }

      // 2. Map status to specific timestamp fields
      const statusDate = timestamp
        ? new Date(parseInt(timestamp) * 1000)
        : new Date();
      const updateData: any = {
        status: status as any,
        errorCode: errorCode?.toString(),
        errorMessage: errorMessage,
        updatedAt: new Date(),
      };

      if (status === "sent") (updateData as any).sentAt = statusDate;
      if (status === "delivered") (updateData as any).deliveredAt = statusDate;
      if (status === "read") {
        (updateData as any).readAt = statusDate;
        // If we get a read but don't have a deliveredAt, set it too
        if (!(message as any).deliveredAt) {
          (updateData as any).deliveredAt = statusDate;
        }
      }
      if (status === "failed") (updateData as any).failedAt = statusDate;

      const updatedMsg = await tx.message.update({
        where: { id: message.id },
        data: updateData,
      });

      // 3. Update Campaign Stats if applicable
      if (message.campaignId) {
        const updateData: any = {};
        // If status is 'read', we should also ensure 'delivered' is accounted for if not already
        if (status === "delivered") {
          updateData.deliveredCount = { increment: 1 };
        } else if (status === "read") {
          updateData.readCount = { increment: 1 };
          // Check if previous status was NOT delivered/read to avoid double counting
          // or missing delivery count if they arrive out of order
          if (message.status !== "delivered" && message.status !== "read") {
            updateData.deliveredCount = { increment: 1 };
          }
        } else if (status === "failed") {
          updateData.failedCount = { increment: 1 };
        }

        if (Object.keys(updateData).length > 0) {
          await tx.campaign.update({
            where: { id: message.campaignId },
            data: updateData,
          });
        }
      }

      // 4. Wallet Deduction (Only on 'sent' or 'accepted' or first successful status)
      // Standard practice: Deducted when Meta accepts the message (status 'sent')
      if (status === "sent" || status === "delivered") {
        // We use status 'sent' as the trigger. If we already deducted (idempotency handled by WalletService), it won't double deduct.
        // Cost is 1 unit for now, can be dynamic based on template/destination.
        const COST = 1.0;
        try {
          await WalletService.deductWallet(message.userId, COST, wamid);
        } catch (e: any) {
          console.error(
            `[MessageService] Wallet deduction failed but continuing status update:`,
            e.message,
          );
        }
      }

      // 5. Update Reminder Status if applicable
      if ((message as any).reminderId) {
        if (status === "delivered" || status === "read") {
          await tx.contactReminder.update({
            where: { id: (message as any).reminderId },
            data: { delivered: true }
          });
        }
      }

      // Emit Socket update via Redis bridge
      await publishSocketEvent("message_status_update", { wamid, status });

      return updatedMsg;
    });
  }

  /**
   * Handles inbound messages from customers.
   */
  static async handleInbound(message: any, contactMeta: any, metadata: any) {
    const phoneNumberId = metadata.phone_number_id;
    const rawFrom = message.from;
    const from = normalizePhone(rawFrom); // Normalize the incoming phone number
    const name = contactMeta?.profile?.name || from;
    let text = "";
    let mediaUrl = null;
    let mediaType = null;
    let caption = null; // New

    if (message.type === "text") {
      text = message.text?.body || "";
    } else if (message.type === "button") {
      text = message.button?.text || "";
    } else if (message.type === "interactive") {
      text =
        message.interactive?.button_reply?.title ||
        message.interactive?.list_reply?.title ||
        "Interactive Response";
    } else if (["image", "video", "audio", "document", "sticker"].includes(message.type)) {
      const media = message[message.type];
      const waMediaId = media.id; // WhatsApp internal ID
      mediaType = message.type;
      caption = media.caption || null;
      text = caption || `Sent a ${message.type}`;

      // Download media from WhatsApp and save locally
      try {
        const waAccount = await prisma.whatsAppAccount.findFirst({
          where: { phoneNumberId },
        });

        if (waAccount?.accessToken) {
          const accessToken = waAccount.accessToken;

          // Step 1: Get media URL from WhatsApp
          const mediaInfoRes = await fetch(`https://graph.facebook.com/v21.0/${waMediaId}`, {
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
            const fs = require('fs');
            const path = require('path');
            const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
            if (!fs.existsSync(uploadsDir)) {
              fs.mkdirSync(uploadsDir, { recursive: true });
            }

            // Generate filename with proper extension
            const mimeType = media.mime_type || mediaInfo.mime_type || 'application/octet-stream';
            const ext = mimeType.split('/')[1]?.split(';')[0] || 'bin';
            const uniqueFileName = `${Date.now()}_incoming_${message.id?.slice(-8) || 'msg'}.${ext}`;
            const localFilePath = path.join(uploadsDir, uniqueFileName);

            fs.writeFileSync(localFilePath, mediaBuffer);
            mediaUrl = `/uploads/${uniqueFileName}`;

            console.log(`[MessageService] Media saved: ${mediaUrl}`);
          }
        }
      } catch (downloadError) {
        console.error('[MessageService] Failed to download media:', downloadError);
        // Keep mediaUrl as null if download fails - message will still be saved with text placeholder
      }
    }

    const waAccount = await prisma.whatsAppAccount.findFirst({
      where: { phoneNumberId },
    });

    if (!waAccount) return;

    const userId = waAccount.userId;

    // Contact Lookup with normalization (Digits only vs +prefix)
    let contact = await prisma.contact.findFirst({
      where: {
        userId,
        OR: [{ phone: from }, { phone: `+${from}` }],
      },
    });

    if (!contact) {
      contact = await prisma.contact.create({
        data: { userId, phone: from, name },
      });
    }

    // Conversation – First try to find existing by userId+contactId or userId+phone
    // We have TWO unique constraints: @@unique([userId, phone]) and @@unique([userId, contactId])
    const phoneKey = normalizePhone(contact.phone || from);
    let conversation;

    // First, check if a conversation exists for this contact (by contactId)
    conversation = await prisma.conversation.findFirst({
      where: {
        userId,
        OR: [
          { contactId: contact.id },
          { phone: phoneKey }
        ]
      }
    });

    if (conversation) {
      // Update existing conversation
      conversation = await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastInboundAt: new Date(),
          contactId: contact.id,
          phone: phoneKey, // Ensure phone is normalized
          name: name ?? undefined,
        },
      });
    } else {
      // Create new conversation
      try {
        conversation = await prisma.conversation.create({
          data: {
            userId,
            phone: phoneKey,
            name,
            contactId: contact.id,
            lastInboundAt: new Date(),
          },
        });
      } catch (err: any) {
        // Race condition: another job created it between our lookup and create
        if (err?.code === "P2002") {
          conversation = await prisma.conversation.findFirst({
            where: {
              userId,
              OR: [
                { contactId: contact.id },
                { phone: phoneKey }
              ]
            }
          });
          if (conversation) {
            conversation = await prisma.conversation.update({
              where: { id: conversation.id },
              data: {
                lastInboundAt: new Date(),
                contactId: contact.id,
                name: name ?? undefined,
              },
            });
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }
    }

    // Save Message
    const savedMsg = await prisma.message.create({
      data: {
        userId,
        contactId: contact.id,
        conversationId: conversation.id,
        text,
        content: text,
        mediaUrl,
        mediaType,
        caption,
        sentBy: "customer",
        direction: "incoming",
        status: "sent",
        sentAt: message.timestamp
          ? new Date(parseInt(message.timestamp) * 1000)
          : new Date(),
        whatsappMessageId: message.id,
        type: message.type,
      },
    });

    // Emit via Redis bridge for real-time update
    await publishSocketEvent("new_message", {
      id: savedMsg.id,
      contactId: contact.id,
      userId,
      text,
      direction: "incoming",
      status: "sent",
      createdAt: savedMsg.createdAt?.toISOString?.() || new Date().toISOString(),
      whatsappMessageId: message.id,
      mediaUrl,
      mediaType,
      contactName: name,
      contactPhone: from,
    });

    return savedMsg;
  }
}
