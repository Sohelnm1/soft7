"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookWorker = void 0;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const prisma_1 = require("../lib/prisma");
const message_service_1 = require("../services/message.service");
const connection = new ioredis_1.default(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: null,
});
const WEBHOOK_QUEUE_NAME = "wa-webhook-queue";
/**
 * BullMQ Worker to process webhooks.
 * This runs in a separate process or alongside the app.
 */
exports.webhookWorker = new bullmq_1.Worker(WEBHOOK_QUEUE_NAME, async (job) => {
    const { internalId, payload } = job.data;
    const metaId = job.id; // Deterministic ID
    console.log(`[WebhookWorker] 🚀 Processing Job ${metaId} (Internal Log: ${internalId})...`);
    try {
        // 1. Update internal log status to PROCESSING
        await prisma_1.prisma.incomingWebhook.update({
            where: { id: internalId },
            data: { status: "PROCESSING" }
        });
        const entry = payload.entry?.[0];
        const change = entry?.changes?.[0];
        const value = change?.value;
        if (!value) {
            console.warn(`[WebhookWorker] ⚠️ No value found in payload for Job ${metaId}`);
            await prisma_1.prisma.incomingWebhook.update({
                where: { id: internalId },
                data: { status: "FAILED", error: "Empty payload value" }
            });
            return;
        }
        // 2. Handle Status Updates (sent, delivered, read, failed)
        if (value.statuses?.[0]) {
            const s = value.statuses[0];
            console.log(`[WebhookWorker] Handling Status Update: ${s.id} -> ${s.status}`);
            await message_service_1.MessageService.handleStatusUpdate(s.id, s.status, {
                timestamp: s.timestamp,
                errorCode: s.errors?.[0]?.code,
                errorMessage: s.errors?.[0]?.message
            });
        }
        // 3. Handle Incoming Messages (text, media, buttons)
        if (value.messages?.[0]) {
            const m = value.messages[0];
            const contact = value.contacts?.[0];
            const metadata = value.metadata;
            console.log(`[WebhookWorker] Handling Inbound Message from ${m.from} (Type: ${m.type})`);
            await message_service_1.MessageService.handleInbound(m, contact, metadata);
        }
        // 4. Mark as PROCESSED
        await prisma_1.prisma.incomingWebhook.update({
            where: { id: internalId },
            data: { status: "PROCESSED", processedAt: new Date() }
        });
        console.log(`[WebhookWorker] ✅ Successfully processed Job ${metaId}`);
        return { success: true };
    }
    catch (error) {
        console.error(`[WebhookWorker] ❌ Error Job ${metaId}:`, error.message);
        // Mark internal log as FAILED but allow BullMQ to retry the job
        await prisma_1.prisma.incomingWebhook.update({
            where: { id: internalId },
            data: { status: "FAILED", error: error.message }
        });
        throw error; // Rethrow triggers retry
    }
}, {
    connection,
    concurrency: parseInt(process.env.WEBHOOK_CONCURRENCY || "10"),
});
exports.webhookWorker.on("failed", (job, err) => {
    console.error(`[WebhookWorker] 🚨 Job ${job?.id} failed permanently after retries: ${err.message}`);
});
