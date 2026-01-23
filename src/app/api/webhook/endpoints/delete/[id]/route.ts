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

async function getParams<T>(p: Promise<T>): Promise<T> {
  return await p;
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in first." },
        { status: 401 }
      );
    }

    const { id } = await getParams(context.params);
    const endpointId = Number(id);

    // ✅ Verify ownership
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

    // Delete subscriptions first (cascade)
    await prisma.webhookSubscription.deleteMany({
      where: { endpointId },
    });

    // Delete endpoint
    await prisma.webhookEndpoint.delete({
      where: { id: endpointId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting webhook endpoint:", error);
    return NextResponse.json({ error: "Failed to delete endpoint" }, { status: 500 });
  }
}