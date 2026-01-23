// app/api/notifications/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) throw new Error("JWT_SECRET is not defined.");

interface JwtPayload {
  id: number;
}

/* -------------------------------------------------
   AUTH HELPERS
-------------------------------------------------- */
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

/* -------------------------------------------------
   POST → CREATE A REMINDER
-------------------------------------------------- */
export async function POST(request: Request) {
  const userId = await authenticate();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { note, date, time, assigneeId } = await request.json();

  // validate note
  if (!note?.trim())
    return NextResponse.json(
      { error: "Reminder note is required." },
      { status: 400 }
    );

  // validate time
  if (!time || !/^\d{2}:\d{2}$/.test(time))
    return NextResponse.json(
      { error: "Valid time (HH:mm) required." },
      { status: 400 }
    );

  // default date
  const reminderDate = date || new Date().toISOString().split("T")[0];

  if (!/^\d{4}-\d{2}-\d{2}$/.test(reminderDate))
    return NextResponse.json(
      { error: "Valid date (YYYY-MM-DD) required." },
      { status: 400 }
    );

  // validate assignee
  let assignedToValue: number | null = null;
  if (assigneeId) {
    const check = await prisma.user.findUnique({
      where: { id: Number(assigneeId) },
    });

    if (!check)
      return NextResponse.json(
        { error: "Assignee does not exist." },
        { status: 400 }
      );

    assignedToValue = Number(assigneeId);
  }

  /* -------------------------------------------------
     CREATE REMINDER
  -------------------------------------------------- */
  try {
    const reminder = await prisma.reminder.create({
      data: {
        note: note.trim(),
        date: reminderDate,
        time,
        triggered: false,
        userId, // Owner
        creatorId: userId,
        assignedTo: assignedToValue,
      },

      include: {
        creator: { select: { id: true, name: true, image: true } },
        assignee: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json({ success: true, data: reminder }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Error creating reminder", message: err.message },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------
   GET → LIST REMINDERS FOR THE USER
-------------------------------------------------- */
export async function GET() {
  const userId = await authenticate();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const reminders = await prisma.reminder.findMany({
      where: {
        OR: [
          { creatorId: userId },
          { assignedTo: userId },
          { userId: userId }, // owner
        ],
      },

      include: {
        creator: { select: { id: true, name: true, image: true } },
        assignee: { select: { id: true, name: true, image: true } },
      },

      orderBy: [
        { date: "asc" },
        { time: "asc" }
      ],
    });

    return NextResponse.json({ data: reminders });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Error fetching reminders", message: err.message },
      { status: 500 }
    );
  }
}