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

    const endpoints = await prisma.webhookEndpoint.findMany({
      where: { userId: currentUser.id },
      include: { subscriptions: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(endpoints);
  } catch (error) {
    console.error("Error fetching webhook endpoints:", error);
    return NextResponse.json({ error: "Failed to fetch endpoints" }, { status: 500 });
  }
}