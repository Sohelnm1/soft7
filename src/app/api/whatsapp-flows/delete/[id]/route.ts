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
    const flowId = parseInt(id);

    // ✅ Verify ownership
    const flow = await prisma.whatsappFlow.findFirst({
      where: {
        id: flowId,
        userId: currentUser.id,
      },
    });

    if (!flow) {
      return NextResponse.json(
        { error: "Flow not found or access denied" },
        { status: 404 }
      );
    }

    await prisma.whatsappFlow.delete({ where: { id: flowId } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting WhatsApp flow:", error);
    return NextResponse.json({ error: "Failed to delete flow" }, { status: 500 });
  }
}