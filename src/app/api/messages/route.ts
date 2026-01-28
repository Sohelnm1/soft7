import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
      email: string;
    };
  } catch {
    return null;
  }
}

/* =========================
   GET MESSAGES
========================= */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const contactId = Number(searchParams.get("contactId"));

  if (!contactId) {
    return NextResponse.json({ error: "Missing contactId" }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const messages = await prisma.message.findMany({
    where: {
      contactId,
      userId: user.id,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(messages);
}
/* =========================
   SEND MESSAGE
========================= */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { contactId, text } = await req.json();

    if (!contactId || !text) {
      return NextResponse.json(
        { error: "contactId and text required" },
        { status: 400 }
      );
    }

    // 1️⃣ Contact
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, userId: user.id },
    });

    if (!contact || !contact.phone) {
      return NextResponse.json({ error: "Contact or phone not found" }, { status: 404 });
    }

    // 2️⃣ Conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        userId: user.id,
        phone: contact.phone
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          phone: contact.phone,
          name: contact.name,
          userId: user.id,
          contactId: contact.id
        },
      });
    }

    // 3️⃣ Save message in DB
    const savedMessage = await prisma.message.create({
      data: {
        contactId: contact.id,
        conversationId: conversation.id,
        userId: user.id,
        content: text,
        text,
        sentBy: "me",
        direction: "outgoing",
        status: "sent",
        ...({ sentAt: new Date() } as any)
      },
    });

    // 4️⃣ SEND TO REAL WHATSAPP NUMBER 📲
    const result = await sendWhatsAppMessage(contact.phone, text, user.id);

    // 5️⃣ Update message with Meta's ID (to enable status tracking via webhooks)
    const whatsappMessageId = result.messages?.[0]?.id;
    if (whatsappMessageId) {
      await prisma.message.update({
        where: { id: savedMessage.id },
        data: { whatsappMessageId }
      });
    }

    return NextResponse.json({ ...savedMessage, whatsappMessageId });
  } catch (error) {
    console.error("POST /api/messages error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}