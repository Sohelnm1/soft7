import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

async function getCurrentUser() {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    return decoded as { id: number; email: string };
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in first." },
        { status: 401 }
      );
    }

    const bots = await prisma.chatbot.findMany({
      where: { userId: currentUser.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        published: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(bots);
  } catch (error) {
    console.error("GET /api/chatbots error:", error);
    return NextResponse.json(
      { error: "Failed to load chatbots" },
      { status: 500 }
    );
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

    const body = await req.json();
    const { name, description } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Chatbot name is required" },
        { status: 400 }
      );
    }

    const bot = await prisma.chatbot.create({
      data: {
        name,
        description: description || "",
        status: "draft",
        published: false,
        userId: currentUser.id,
      },
    });

    return NextResponse.json(bot);
  } catch (error) {
    console.error("POST /api/chatbots error:", error);
    return NextResponse.json(
      { error: "Failed to create chatbot" },
      { status: 500 }
    );
  }
}