import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    return decoded as { id: number; email: string };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in first." },
        { status: 401 }
      );
    }

    const { name, phone } = await req.json();

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Name and phone are required" },
        { status: 400 }
      );
    }

    const faqBotId = Math.random().toString(36).substring(2, 10);

    const newFaq = await prisma.chatbotFAQ.create({
      data: {
        name,
        phone,
        faqBotId,
        userId: currentUser.id, // ✅ Link to user
      },
    });

    return NextResponse.json({ success: true, faq: newFaq });
  } catch (err) {
    console.error("Error creating FAQ:", err);
    return NextResponse.json({ error: "Failed to create FAQ" }, { status: 500 });
  }
}
