import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) throw new Error("JWT_SECRET is not defined.");

interface JwtPayload {
  id: number;
}

async function authenticate() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded.id;
  } catch {
    return null;
  }
}

/* ---------------- POST ---------------- */
export async function POST(request: Request) {
  const userId = await authenticate();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { note, date, time, assigneeId } = await request.json();

  if (!note?.trim())
    return NextResponse.json({ error: "Reminder note required" }, { status: 400 });

  if (!time || !/^\d{2}:\d{2}$/.test(time))
    return NextResponse.json({ error: "Invalid time" }, { status: 400 });

  const reminderDate = date || new Date().toISOString().split("T")[0];

  let assignedToValue: number | null = null;
  if (assigneeId) {
    const check = await prisma.teamMember.findUnique({
      where: { id: Number(assigneeId) },
    });
    if (!check)
      return NextResponse.json({ error: "Invalid assignee" }, { status: 400 });
    assignedToValue = Number(assigneeId);
  }

  try {
    // This automatically populates the `user` relation
    const notification = await prisma.notification.create({
      data: {
        title: note.slice(0, 100),
        message: note,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            // add any other user fields you want
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: notification }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/* -------------------------------------------------
   GET  →  list notifications for the auth user
   ------------------------------------------------- */
export async function GET(request: Request) {
  const userId = await authenticate();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: [{ createdAt: "asc" }],
    });

    return NextResponse.json({ data: notifications });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}