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

// ✅ Delete column (verify ownership)
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
    const column = await prisma.column.findFirst({
      where: {
        id: Number(id),
        userId: currentUser.id,
      },
    });

    if (!column) {
      return NextResponse.json(
        { error: "Column not found or access denied" },
        { status: 404 }
      );
    }

    await prisma.column.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting column:", error);
    return NextResponse.json({ error: "Failed to delete column" }, { status: 500 });
  }
}

// ✅ Toggle visibility (verify ownership)
export async function PATCH(
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
    const body = await req.json();

    // ✅ Verify ownership
    const column = await prisma.column.findFirst({
      where: {
        id: Number(id),
        userId: currentUser.id,
      },
    });

    if (!column) {
      return NextResponse.json(
        { error: "Column not found or access denied" },
        { status: 404 }
      );
    }

    const updated = await prisma.column.update({
      where: { id: Number(id) },
      data: { visible: body.visible },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating column:", error);
    return NextResponse.json({ error: "Failed to update column" }, { status: 500 });
  }
}