import { prisma } from "@/lib/prisma";
import { getIO } from "@/lib/socket";

export async function processWebhookQueue(batchSize: number = 500) {
  const webhooks = await prisma.incomingWebhook.findMany({
    where: { status: "PENDING" },
    take: batchSize,
    orderBy: { createdAt: "asc" },
  });

  if (webhooks.length === 0) return { processed: 0 };

  console.log(`Processing ${webhooks.length} webhooks...`);

  const statusUpdates: any[] = [];
  const incomingMessages: any[] = [];
  const campaignStats: Record<
    string,
    { delivered: number; read: number; failed: number }
  > = {};
  const processedIds: number[] = [];

  for (const hook of webhooks) {
    const payload = hook.payload as any;
    const entry = payload.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    if (!value) {
      processedIds.push(hook.id);
      continue;
    }

    // 1. Handle Status Updates
    if (value.statuses?.[0]) {
      const statusObj = value.statuses[0];
      const wamid = statusObj.id;
      const status = statusObj.status; // delivered, read, failed
      const timestamp = statusObj.timestamp;

      statusUpdates.push({
        wamid,
        status,
        timestamp,
        errorCode: statusObj.errors?.[0]?.code,
        errorMessage: statusObj.errors?.[0]?.message,
      });

      // Track Campaign Stats
      // We need to find the message to get its campaignId
      const msg = await prisma.message.findUnique({
        where: { whatsappMessageId: wamid },
        select: { campaignId: true },
      });

      if (msg?.campaignId) {
        if (!campaignStats[msg.campaignId]) {
          campaignStats[msg.campaignId] = { delivered: 0, read: 0, failed: 0 };
        }
        if (status === "delivered") campaignStats[msg.campaignId].delivered++;
        if (status === "read") campaignStats[msg.campaignId].read++;
        if (status === "failed") campaignStats[msg.campaignId].failed++;
      }
    }

    // 2. Handle Incoming Messages
    if (value.messages?.[0]) {
      const message = value.messages[0];
      const contactMeta = value.contacts?.[0];
      const metadata = value.metadata;

      incomingMessages.push({
        message,
        contactMeta,
        metadata,
      });
    }

    processedIds.push(hook.id);
  }

  // --- Perform Batch Updates ---

  // Update Message Statuses
  for (const update of statusUpdates) {
    await prisma.message.updateMany({
      where: { whatsappMessageId: update.wamid },
      data: {
        status: update.status as any,
        errorCode: update.errorCode?.toString(),
        errorMessage: update.errorMessage,
        updatedAt: new Date(),
      },
    });

    // Emit real-time status update
    const io = getIO();
    if (io) {
      io.emit("message_status_update", {
        wamid: update.wamid,
        status: update.status,
      });
    }
  }

  // Update Campaign Stats (Aggregate)
  for (const [campaignId, stats] of Object.entries(campaignStats)) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        deliveredCount: { increment: stats.delivered },
        readCount: { increment: stats.read },
        failedCount: { increment: stats.failed },
      },
    });
  }

  // Process Inbound Messages (More complex, handle one by one but could be optimized)
  for (const item of incomingMessages) {
    await handleInboundMessage(item);
  }

  // Mark webhooks as PROCESSED
  await prisma.incomingWebhook.updateMany({
    where: { id: { in: processedIds } },
    data: { status: "PROCESSED", processedAt: new Date() },
  });

  return { processed: processedIds.length };
}

async function handleInboundMessage({ message, contactMeta, metadata }: any) {
  const phoneNumberId = metadata.phone_number_id;
  const from = message.from;
  const name = contactMeta?.profile?.name || from;
  let text = "";
  let mediaUrl = null;
  let mediaType = null;

  // Extract content based on type
  if (message.type === "text") {
    text = message.text?.body || "";
  } else if (message.type === "button") {
    text = message.button?.text || "";
  } else if (message.type === "interactive") {
    text =
      message.interactive?.button_reply?.title ||
      message.interactive?.list_reply?.title ||
      "Interactive Response";
  } else if (["image", "video", "audio", "document"].includes(message.type)) {
    const media = message[message.type];
    mediaUrl = media.id; // Store ID, will need to fetch actual URL later if needed
    mediaType = message.type;
    text = `Sent a ${message.type}`;
  }

  // Find owner
  const waAccount = await prisma.whatsAppAccount.findFirst({
    where: { phoneNumberId },
  });

  if (!waAccount) return;

  const userId = waAccount.userId;

  // Contact
  let contact = await prisma.contact.findFirst({
    where: { userId, phone: from },
  });

  if (!contact) {
    contact = await prisma.contact.create({
      data: { userId, phone: from, name },
    });
  }

  // Conversation – upsert by (userId, contactId) to avoid unique constraint on (userId, contactId)
  const conversation = await prisma.conversation.upsert({
    where: { userId_contactId: { userId, contactId: contact.id } },
    update: { lastInboundAt: new Date(), phone: from },
    create: {
      userId,
      phone: from,
      name,
      contactId: contact.id,
      lastInboundAt: new Date(),
    },
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
      type: message.type,
    },
  });

  // Real-time Emit
  const io = getIO();
  if (io) {
    io.emit("new_message", savedMsg);
  }
}
