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
      where: { verifyToken: token }
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

    // 1️⃣ Fast Ingest: Extract Meta ID for Queue Idempotency
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    const metaId = value?.messages?.[0]?.id || value?.statuses?.[0]?.id || `wh_${Date.now()}`;

    // 2️⃣ Record raw payload to DB
    const log = await prisma.incomingWebhook.create({
      data: {
        payload: body,
        status: "PENDING"
      }
    });

    // 3️⃣ Enqueue for async processing
    // Deterministic metaId ensures BullMQ drops duplicate retries within the same backoff window
    await enqueueWebhook(metaId, log.id, body);

    // 4️⃣ Return 200 OK Immediately (<100ms goal)
    return NextResponse.json({ status: "accepted", id: log.id });

  } catch (error: any) {
    console.error("WhatsApp Webhook Ingest Error:", error.message);
    // Return 200 to Meta to avoid retries if the payload was received but processing enqueued
    return NextResponse.json({ status: "error", message: error.message }, { status: 200 });
  }
}
