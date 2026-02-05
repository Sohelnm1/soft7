import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TemplateService } from "@/services/template.service";

export async function GET() {
  const now = new Date();

  const currentDate = now.toISOString().split("T")[0]; // yyyy-mm-dd
  const currentTime = now.toTimeString().slice(0, 5);  // HH:MM

  // Fetch due reminders
  const dueReminders = await prisma.contactReminder.findMany({
    where: {
      onDate: currentDate,
      delivered: false,
      triggered: false,
      fromTime: { lte: currentTime },
      toTime: { gte: currentTime }
    },
    include: {
      user: true,
      contact: true,
    }
  });

  const results = [];

  for (const reminder of dueReminders) {
    try {
      const r = reminder as any;
      if (!r.templateName) {
        console.warn(`[ReminderRun] Reminder ${reminder.id} has no templateName, skipping.`);
        continue;
      }

      await TemplateService.sendTemplate({
        userId: reminder.userId,
        contactId: reminder.contactId,
        templateName: r.templateName,
        language: r.language || "en",
        variables: r.variables as Record<string, string> || {},
        reminderId: reminder.id
      });

      // Mark as triggered so we don't try again if it fails Meta send
      // (Status tracking will handle the rest)
      await prisma.contactReminder.update({
        where: { id: reminder.id },
        data: { triggered: true }
      });

      results.push({ id: reminder.id, status: "success" });
    } catch (err: any) {
      console.error(`[ReminderRun] Failed to send reminder ${reminder.id}:`, err.message);
      results.push({ id: reminder.id, status: "error", message: err.message });

      // Still mark as triggered to avoid infinite loops on bad templates
      await prisma.contactReminder.update({
        where: { id: reminder.id },
        data: { triggered: true }
      });
    }
  }

  return NextResponse.json({
    status: "success",
    processed: dueReminders.length,
    results,
    timestamp: now
  });
}
