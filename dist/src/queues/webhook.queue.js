"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookQueue = exports.WEBHOOK_QUEUE_NAME = void 0;
exports.enqueueWebhook = enqueueWebhook;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const connection = new ioredis_1.default(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: null,
});
exports.WEBHOOK_QUEUE_NAME = "wa-webhook-queue";
// Create the queue
exports.webhookQueue = new bullmq_1.Queue(exports.WEBHOOK_QUEUE_NAME, {
    connection,
    defaultJobOptions: {
        attempts: 5,
        backoff: {
            type: "exponential",
            delay: 5000, // 5s, 10s, 20s...
        },
        removeOnComplete: true,
        removeOnFail: false,
    },
});
/**
 * Enqueue a webhook for asynchronous processing.
 * @param metaId Unique ID from Meta (message_id or status_id)
 * @param internalId Database ID from IncomingWebhook table
 * @param payload Raw webhook payload
 */
async function enqueueWebhook(metaId, internalId, payload) {
    // Deterministic Job ID for strict idempotency at the queue level
    const jobId = metaId;
    try {
        await exports.webhookQueue.add("process-webhook", { internalId, payload }, { jobId } // BullMQ will ignore duplicates with the same jobId
        );
        console.log(`[WebhookQueue] Enqueued Job: ${jobId} (Internal: ${internalId})`);
    }
    catch (error) {
        console.error(`[WebhookQueue] Failed to enqueue Job ${jobId}:`, error.message);
        throw error;
    }
}
