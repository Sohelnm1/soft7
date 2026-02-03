import IORedis from "ioredis";
import { Server as IOServer } from "socket.io";

const SOCKET_CHANNEL = "socket-events";

// Redis publisher (used by workers)
let publisher: IORedis | null = null;

function getPublisher(): IORedis {
    if (!publisher) {
        publisher = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
            maxRetriesPerRequest: null,
        });
        console.log("[SocketBridge] 📡 Publisher connected to Redis");
    }
    return publisher;
}

/**
 * Publish a socket event via Redis (called from workers)
 */
export async function publishSocketEvent(event: string, data: any) {
    try {
        const message = JSON.stringify({ event, data });
        await getPublisher().publish(SOCKET_CHANNEL, message);
        console.log(`[SocketBridge] 📤 Published ${event}:`, typeof data === 'object' && data?.id ? `id=${data.id}` : '');
    } catch (error) {
        console.error("[SocketBridge] ❌ Failed to publish:", error);
    }
}

/**
 * Initialize Redis subscriber and forward events to Socket.IO
 * (called from main server process)
 */
export function initSocketBridge(io: IOServer) {
    const subscriber = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
        maxRetriesPerRequest: null,
    });

    subscriber.subscribe(SOCKET_CHANNEL, (err, count) => {
        if (err) {
            console.error("[SocketBridge] ❌ Failed to subscribe:", err);
        } else {
            console.log(`[SocketBridge] 📡 Subscribed to ${count} channel(s)`);
        }
    });

    subscriber.on("message", (channel, message) => {
        if (channel === SOCKET_CHANNEL) {
            try {
                const { event, data } = JSON.parse(message);
                io.emit(event, data);
                console.log(`[SocketBridge] 📤 Emitted ${event} to clients`);
            } catch (error) {
                console.error("[SocketBridge] ❌ Failed to parse message:", error);
            }
        }
    });

    console.log("[SocketBridge] ✅ Socket bridge initialized");
}
