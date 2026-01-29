"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageService = void 0;
const { prisma } = require("../lib/prisma.worker.cjs");
const wallet_service_1 = require("./wallet.service");
/**
 * Normalizes a phone number by removing non-numeric characters
 * and ensuring it doesn't have a leading + or 00.
 */
function normalizePhone(phone) {
    if (!phone)
        return phone;
    // Remove all non-digits
    return phone.replace(/\D/g, "");
}
// Lazy-load socket only if available (Next.js runtime)
let getSocketIO = null;
try {
    getSocketIO = require("../lib/socket").getIO;
}
catch (e) {
    // BullMQ Worker environment
}
class MessageService {
    /**
     * Updates the status of a message and triggers wallet deduction if needed.
     */
    static async handleStatusUpdate(wamid, status, details) {
        const { timestamp, errorCode, errorMessage } = details;
        return await prisma.$transaction(async (tx) => {
            // 1. Find message and campaign
            const message = await tx.message.findUnique({
                where: { whatsappMessageId: wamid },
                select: { id: true, userId: true, campaignId: true, status: true, ...{ deliveredAt: true } }
            });
            if (!message) {
                console.warn(`[MessageService] Message ${wamid} not found in database.`);
                return null;
            }
            // 2. Map status to specific timestamp fields
            const statusDate = timestamp ? new Date(parseInt(timestamp) * 1000) : new Date();
            const updateData = {
                status: status,
                errorCode: errorCode?.toString(),
                errorMessage: errorMessage,
                updatedAt: new Date()
            };
            if (status === "sent")
                updateData.sentAt = statusDate;
            if (status === "delivered")
                updateData.deliveredAt = statusDate;
            if (status === "read") {
                updateData.readAt = statusDate;
                // If we get a read but don't have a deliveredAt, set it too
                if (!message.deliveredAt) {
                    updateData.deliveredAt = statusDate;
                }
            }
            if (status === "failed")
                updateData.failedAt = statusDate;
            const updatedMsg = await tx.message.update({
                where: { id: message.id },
                data: updateData
            });
            // 3. Update Campaign Stats if applicable
            if (message.campaignId) {
                const updateData = {};
                // If status is 'read', we should also ensure 'delivered' is accounted for if not already
                if (status === "delivered") {
                    updateData.deliveredCount = { increment: 1 };
                }
                else if (status === "read") {
                    updateData.readCount = { increment: 1 };
                    // Check if previous status was NOT delivered/read to avoid double counting 
                    // or missing delivery count if they arrive out of order
                    if (message.status !== "delivered" && message.status !== "read") {
                        updateData.deliveredCount = { increment: 1 };
                    }
                }
                else if (status === "failed") {
                    updateData.failedCount = { increment: 1 };
                }
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
                    await wallet_service_1.WalletService.deductWallet(message.userId, COST, wamid);
                }
                catch (e) {
                    console.error(`[MessageService] Wallet deduction failed but continuing status update:`, e.message);
                }
            }
            // Emit Socket update
            const io = getSocketIO?.();
            if (io) {
                io.emit("message_status_update", { wamid, status });
            }
            return updatedMsg;
        });
    }
    /**
     * Handles inbound messages from customers.
     */
    static async handleInbound(message, contactMeta, metadata) {
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
        }
        else if (message.type === "button") {
            text = message.button?.text || "";
        }
        else if (message.type === "interactive") {
            text = message.interactive?.button_reply?.title || message.interactive?.list_reply?.title || "Interactive Response";
        }
        else if (["image", "video", "audio", "document"].includes(message.type)) {
            const media = message[message.type];
            mediaUrl = media.id; // WhatsApp internal ID
            mediaType = message.type;
            caption = media.caption || null;
            text = caption || `Sent a ${message.type}`;
        }
        const waAccount = await prisma.whatsAppAccount.findFirst({
            where: { phoneNumberId }
        });
        if (!waAccount)
            return;
        const userId = waAccount.userId;
        // Contact Lookup with normalization (Digits only vs +prefix)
        let contact = await prisma.contact.findFirst({
            where: {
                userId,
                OR: [
                    { phone: from },
                    { phone: `+${from}` }
                ]
            }
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
                caption,
                sentBy: "customer",
                direction: "incoming",
                status: "sent",
                sentAt: message.timestamp ? new Date(parseInt(message.timestamp) * 1000) : new Date(),
                whatsappMessageId: message.id,
                type: message.type
            }
        });
        const io = getSocketIO?.();
        if (io) {
            io.emit("new_message", savedMsg);
        }
        return savedMsg;
    }
}
exports.MessageService = MessageService;
