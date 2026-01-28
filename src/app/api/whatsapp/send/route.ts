// Path: src/app/api/whatsapp/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as { id: number; email: string };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { phone, message } = await req.json();

    if (!phone || !message) {
      return NextResponse.json({ error: "Phone and message are required" }, { status: 400 });
    }

    // Use our helper which now supports per-user database config
    await sendWhatsAppMessage(phone, message, user.id);

    const conversation = await prisma.conversation.findFirst({
      where: { phone, userId: user.id }
    });

    if (conversation) {
      await prisma.message.create({
        data: {
          userId: user.id,
          conversationId: conversation.id,
          contactId: 0, // Should ideally find contactId
          content: message,
          text: message,
          direction: "outgoing",
          sentBy: "business",
          status: "sent",
          sentAt: new Date()
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("WhatsApp Send Error:", error);
    return NextResponse.json({ error: error.message || "Failed to send message" }, { status: 500 });
  }
}
