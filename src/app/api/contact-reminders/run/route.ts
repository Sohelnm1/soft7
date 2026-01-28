import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const now = new Date();

  const currentDate = now.toISOString().split("T")[0]; // yyyy-mm-dd
  const currentTime = now.toTimeString().slice(0, 5);  // HH:MM

  // Fetch due reminders
  const dueReminders = await prisma.contactReminder.findMany({
    where: {
      onDate: currentDate,
      delivered: false,
      fromTime: { lte: currentTime },
      toTime: { gte: currentTime }
    },
    include: {
      user: true,
      contact: true,
    }
  });

  for (const reminder of dueReminders) {
    // ✅ CREATE MESSAGE EXACTLY LIKE USER SENT MESSAGE
    await prisma.message.create({
      data: {
        contactId: reminder.contactId,
        userId: reminder.userId,

        content: reminder.message,
        text: reminder.message,

        sentBy: "me",         // ✅ RIGHT SIDE
        direction: "outgoing",
        status: "sent",
        sentAt: new Date()
      },
    });

    // Mark as delivered
    await prisma.contactReminder.update({
      where: { id: reminder.id },
      data: { delivered: true }
    });
  }

  return NextResponse.json({
    status: "success",
    sent: dueReminders.length,
    timestamp: now
  });
}
