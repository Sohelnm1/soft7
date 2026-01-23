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
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    const message = value?.messages?.[0];
    const contactMeta = value?.contacts?.[0];
    const metadata = value?.metadata;

    if (!message || !metadata) {
      return NextResponse.json({ status: "ignored" });
    }

    const phoneNumberId = metadata.phone_number_id;
    const from = message.from; // customer phone
    const name = contactMeta?.profile?.name || from;
    const text = message.text?.body || "";

    /* 1️⃣ Find WhatsApp account owner */
    const waAccount = await prisma.whatsAppAccount.findFirst({
      where: { phoneNumberId }
    });

    if (!waAccount) {
      return NextResponse.json({ status: "unknown-number" });
    }

    const userId = waAccount.userId;

    /* 2️⃣ Find or create Contact */
    let contact = await prisma.contact.findFirst({
      where: { userId, phone: from }
    });

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          userId,
          phone: from,
          name
        }
      });
    }

    /* 3️⃣ Find or create Conversation */
    const conversation = await prisma.conversation.upsert({
      where: {
        userId_phone: {
          userId,
          phone: from
        }
      },
      update: {
        lastInboundAt: new Date()
      },
      create: {
        userId,
        phone: from,
        name,
        lastInboundAt: new Date()
      }
    });

    /* 4️⃣ Save INCOMING message */
    await prisma.message.create({
      data: {
        userId,
        contactId: contact.id,
        conversationId: conversation.id,
        content: text,
        text,
        sentBy: "customer",
        from,
        senderId: from,
        receiverId: phoneNumberId,
        direction: "incoming", // ✅ FIXED
        status: "received",
        whatsappMessageId: message.id,
        seen: false
      }
    });

    return NextResponse.json({ status: "received" });
  } catch (error) {
    console.error("WhatsApp Webhook Error:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
