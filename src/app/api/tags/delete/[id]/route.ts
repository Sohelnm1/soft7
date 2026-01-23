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

    // ✅ Verify ownership
    const tag = await prisma.tag.findFirst({
      where: {
        id: parseInt(id),
        userId: currentUser.id,
      },
    });

    if (!tag) {
      return NextResponse.json(
        { error: "Tag not found or access denied" },
        { status: 404 }
      );
    }

    await prisma.tag.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting tag:", error);
    return NextResponse.json({ error: "Failed to delete tag" }, { status: 500 });
  }
}