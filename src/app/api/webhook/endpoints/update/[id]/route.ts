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

export async function PUT(
  req: Request,
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

    const body = await req.json();
    const updated = await prisma.webhookEndpoint.update({
      where: { id: endpointId },
      data: {
        name: body.name,
        url: body.url,
        isActive: body.isActive,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating webhook endpoint:", error);
    return NextResponse.json({ error: "Failed to update endpoint" }, { status: 500 });
  }
}