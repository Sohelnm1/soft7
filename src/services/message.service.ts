const { prisma } = require("../lib/prisma.worker.cjs");
import { getIO } from "../lib/socket";
import { WalletService } from "./wallet.service";

export class MessageService {
    /**
     * Updates the status of a message and triggers wallet deduction if needed.
     */
    static async handleStatusUpdate(wamid: string, status: string, details: any) {
        const { timestamp, errorCode, errorMessage } = details;

        return await prisma.$transaction(async (tx) => {
            // 1. Find message and campaign
            const message = await tx.message.findUnique({
                where: { whatsappMessageId: wamid },
                select: { id: true, userId: true, campaignId: true, status: true }
            });

            if (!message) {
                console.warn(`[MessageService] Message ${wamid} not found in database.`);
                return null;
            }

            // 2. Update Message Status
            const updatedMsg = await tx.message.update({
                where: { id: message.id },
                data: {
                    status: status as any,
                    errorCode: errorCode?.toString(),
                    errorMessage: errorMessage,
                    updatedAt: new Date()
                }
            });

            // 3. Update Campaign Stats if applicable
            if (message.campaignId) {
                const updateData: any = {};
                if (status === "delivered") updateData.deliveredCount = { increment: 1 };
                if (status === "read") updateData.readCount = { increment: 1 };
                if (status === "failed") updateData.failedCount = { increment: 1 };

                if (Object.keys(updateData).length > 0) {
                    await tx.campaign.update({
                        where: { id: message.campaignId },
                        data: updateData
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
                    console.error(`[MessageService] Wallet deduction failed but continuing status update:`, e.message);
                }
            }

            // Emit Socket update
            const io = getIO();
            if (io) {
                io.emit("message_status_update", { wamid, status });
            }

            return updatedMsg;
        });
    }

    /**
     * Handles inbound messages from customers.
     */
    static async handleInbound(message: any, contactMeta: any, metadata: any) {
        const phoneNumberId = metadata.phone_number_id;
        const from = message.from;
        const name = contactMeta?.profile?.name || from;
        let text = "";
        let mediaUrl = null;
        let mediaType = null;

        if (message.type === "text") {
            text = message.text?.body || "";
        } else if (message.type === "button") {
            text = message.button?.text || "";
        } else if (message.type === "interactive") {
            text = message.interactive?.button_reply?.title || message.interactive?.list_reply?.title || "Interactive Response";
        } else if (["image", "video", "audio", "document"].includes(message.type)) {
            const media = message[message.type];
            mediaUrl = media.id;
            mediaType = message.type;
            text = `Sent a ${message.type}`;
        }

        const waAccount = await prisma.whatsAppAccount.findFirst({
            where: { phoneNumberId }
        });

        if (!waAccount) return;

        const userId = waAccount.userId;

        // Contact
        let contact = await prisma.contact.findFirst({
            where: { userId, phone: from }
        });

        if (!contact) {
            contact = await prisma.contact.create({
                data: { userId, phone: from, name }
            });
        }

        // Conversation
        const conversation = await prisma.conversation.upsert({
            where: { userId_phone: { userId, phone: from } },
            update: { lastInboundAt: new Date() },
            create: { userId, phone: from, name, contactId: contact.id, lastInboundAt: new Date() }
        });

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
                sentBy: "customer",
                direction: "incoming",
                status: "sent",
                whatsappMessageId: message.id,
                type: message.type
            }
        });

        const io = getIO();
        if (io) {
            io.emit("new_message", savedMsg);
        }

        return savedMsg;
    }
}
