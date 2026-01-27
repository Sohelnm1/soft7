import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* =========================
   VERIFY WEBHOOK (GET)
========================= */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token) {
    // 1️⃣ Check global token (backward compatibility)
    if (token === process.env.WA_VERIFY_TOKEN) {
      return new NextResponse(challenge, { status: 200 });
    }

    // 2️⃣ Check per-user tokens in DB
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
   RECEIVE CUSTOMER MESSAGE
========================= */
/* =========================
   RECEIVE WEBHOOK (POST)
   Fast Ingest Mode: Only record raw payload
========================= */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("📥 RECEIVED WEBHOOK PAYLOAD:", JSON.stringify(body, null, 2));

    // 1️⃣ Fast Log to DB
    const createdLog = await prisma.incomingWebhook.create({
      data: {
        payload: body,
        status: "PENDING"
      }
    });
    console.log("✅ Logged webhook to DB with ID:", createdLog.id);

    // 2️⃣ Immediate 200 OK Response to Meta
    return NextResponse.json({ status: "recorded" });
  } catch (error) {
    console.error("WhatsApp Webhook Ingest Error:", error);
    // Even on error, we usually want to return 200 to Meta to avoid retries 
    // if the payload was successfully parsed but DB write failed.
    // However, for debugging we might want 500.
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
