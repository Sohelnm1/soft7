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

    const { id, name, phone } = await req.json();

    if (!id || !name || !phone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ✅ Verify ownership before updating
    const existingFaq = await prisma.chatbotFAQ.findFirst({
      where: {
        id: Number(id),
        userId: currentUser.id,
      },
    });

    if (!existingFaq) {
      return NextResponse.json(
        { error: "FAQ not found or access denied" },
        { status: 404 }
      );
    }

    const updated = await prisma.chatbotFAQ.update({
      where: { id: Number(id) },
      data: { name, phone },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating FAQ bot:", error);
    return NextResponse.json({ error: "Failed to update FAQ bot" }, { status: 500 });
  }
}
