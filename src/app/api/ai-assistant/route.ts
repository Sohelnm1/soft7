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

    const assistants = await prisma.aiAssistant.findMany({
      where: { userId: currentUser.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(assistants);
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json({ error: "Failed to load assistants" }, { status: 500 });
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

    const data = await req.json();

    const {
      name,
      role,
      status = "active",
      promptType,
      predefinedPrompt,
      customPrompt,
      provider,
      model,
      apiKey,
    } = data;

    const newAssistant = await prisma.aiAssistant.create({
      data: {
        name,
        role,
        status,
        promptType,
        predefinedPrompt,
        customPrompt,
        provider,
        model,
        apiKey,
        userId: currentUser.id, // ✅ Link to user
      },
    });

    return NextResponse.json(newAssistant);
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json({ error: "Failed to create assistant" }, { status: 500 });
  }
}