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

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // ✅ Verify ownership before deleting
    const faq = await prisma.chatbotFAQ.findFirst({
      where: {
        id: Number(id),
        userId: currentUser.id,
      },
    });

    if (!faq) {
      return NextResponse.json(
        { error: "FAQ not found or access denied" },
        { status: 404 }
      );
    }

    await prisma.chatbotFAQ.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting FAQ bot:", error);
    return NextResponse.json({ error: "Failed to delete FAQ bot" }, { status: 500 });
  }
}
