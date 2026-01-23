// app/api/contact-reminders/[id]/route.ts
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

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const reminderId = parseInt(params.id);

    if (isNaN(reminderId)) {
      return NextResponse.json(
        { error: "Invalid reminder ID" },
        { status: 400 }
      );
    }

    // Check if reminder exists and belongs to user
    const reminder = await prisma.contactReminder.findFirst({
      where: {
        id: reminderId,
        userId: currentUser.id,
      },
    });

    if (!reminder) {
      return NextResponse.json(
        { error: "Reminder not found" },
        { status: 404 }
      );
    }

    // Delete the reminder
    await prisma.contactReminder.delete({
      where: {
        id: reminderId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error deleting reminder:", error);
    return NextResponse.json(
      { error: "Failed to delete reminder" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const reminderId = parseInt(params.id);

    if (isNaN(reminderId)) {
      return NextResponse.json(
        { error: "Invalid reminder ID" },
        { status: 400 }
      );
    }

    // Fetch single reminder with contact details
    const reminder = await prisma.contactReminder.findFirst({
      where: {
        id: reminderId,
        userId: currentUser.id,
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    if (!reminder) {
      return NextResponse.json(
        { error: "Reminder not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(reminder);
  } catch (error: unknown) {
    console.error("Error fetching reminder:", error);
    return NextResponse.json(
      { error: "Failed to fetch reminder" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const reminderId = parseInt(params.id);

    if (isNaN(reminderId)) {
      return NextResponse.json(
        { error: "Invalid reminder ID" },
        { status: 400 }
      );
    }

    // Check if reminder exists and belongs to user
    const existingReminder = await prisma.contactReminder.findFirst({
      where: {
        id: reminderId,
        userId: currentUser.id,
      },
    });

    if (!existingReminder) {
      return NextResponse.json(
        { error: "Reminder not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const {
      message,
      scheduleType,
      onDate,
      fromTime,
      toTime,
      allDay,
      repeatEvery,
      repeatUnit,
      selectedDays,
    } = body;

    // Update the reminder
    const updatedReminder = await prisma.contactReminder.update({
      where: {
        id: reminderId,
      },
      data: {
        message: message ?? existingReminder.message,
        scheduleType: scheduleType ?? existingReminder.scheduleType,
        onDate: onDate ?? existingReminder.onDate,
        fromTime: allDay ? null : fromTime ?? existingReminder.fromTime,
        toTime: allDay ? null : toTime ?? existingReminder.toTime,
        allDay: allDay ?? existingReminder.allDay,
        repeatEvery: repeatEvery ?? existingReminder.repeatEvery,
        repeatUnit: repeatUnit ?? existingReminder.repeatUnit,
        selectedDays: selectedDays ?? existingReminder.selectedDays,
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json(updatedReminder);
  } catch (error: unknown) {
    console.error("Error updating reminder:", error);
    return NextResponse.json(
      { error: "Failed to update reminder" },
      { status: 500 }
    );
  }
}