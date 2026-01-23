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
    const { endpointId, subscribedEvents } = body;

    if (!endpointId || !subscribedEvents) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // ✅ Verify the endpoint belongs to the user
    const endpoint = await prisma.webhookEndpoint.findFirst({
      where: {
        id: endpointId,
        userId: currentUser.id,
      },
    });

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint not found or access denied" },
        { status: 404 }
      );
    }

    // Delete old subscriptions
    await prisma.webhookSubscription.deleteMany({
      where: { endpointId },
    });

    // Insert new subscriptions
    const subscriptions = subscribedEvents.map((eventName: string) => ({
      endpointId,
      eventName,
    }));

    await prisma.webhookSubscription.createMany({ data: subscriptions });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error saving subscriptions:", error);
    return NextResponse.json({ error: "Failed to save subscriptions" }, { status: 500 });
  }
}