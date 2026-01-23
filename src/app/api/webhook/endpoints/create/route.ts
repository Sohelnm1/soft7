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

    const body = await req.json();
    const endpoint = await prisma.webhookEndpoint.create({
      data: {
        name: body.name,
        url: body.url,
        isActive: body.isActive ?? true,
        userId: currentUser.id, // ✅ Link to user
      },
    });

    return NextResponse.json(endpoint, { status: 201 });
  } catch (error) {
    console.error("Error creating webhook endpoint:", error);
    return NextResponse.json({ error: "Failed to create endpoint" }, { status: 500 });
  }
}