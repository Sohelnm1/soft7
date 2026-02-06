import { prisma } from "../lib/prisma";
import { TemplateService } from "./template.service";
import { addDays, addWeeks, addMonths, parseISO, format } from "date-fns";

export class ReminderService {
    /**
     * Checks for due reminders and sends them using TemplateService.
     */
    static async runDueReminders() {
        const now = new Date();
        const currentDate = format(now, "yyyy-MM-dd");
        const currentTime = format(now, "HH:mm");

        console.log(`[ReminderService] Checking reminders for ${currentDate} ${currentTime}`);

        try {
            // Fetch due reminders: 
            // 1. Reminders from past dates that haven't triggered (Catch-up)
            // 2. Reminders from today where time has arrived
            const dueReminders = await prisma.contactReminder.findMany({
                where: {
                    delivered: false,
                    triggered: false,
                    OR: [
                        { onDate: { lt: currentDate } }, // Any date before today
                        {
                            AND: [
                                { onDate: currentDate },
                                {
                                    OR: [
                                        { fromTime: { lte: currentTime } },
                                        { allDay: true }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                include: {
                    user: true,
                    contact: true,
                }
            });

            if
                (dueReminders.length === 0) return { status: "success", sent: 0 };


            const results = [];
            for (const reminder of dueReminders) {

                try {
                    const r = reminder as any;

                    if (!r.templateName) {
                        console.warn(`[ReminderService] Reminder ${reminder.id} has no templateName, skipping.`);

                        continue;
                    }


                    // 1. Send the template

                    await TemplateService.sendTemplate({
                        userId: reminder.userId,

                        contactId: reminder.contactId,
                        templateName: r.templateName,
                        language: r.language || "en",
                        variables: r.variables as Record<string, string> || {},
                        reminderId: reminder.id
                    });

                    // 2. Handle Recurrence or Mark as Triggered
                    if (reminder.scheduleType === "repeated" && reminder.repeatEvery && reminder.repeatUnit && reminder.onDate) {
                        const currentOnDate = parseISO(reminder.onDate);
                        let nextDate: Date;

                        switch (reminder.repeatUnit) {
                            case "weeks":
                                nextDate = addWeeks(currentOnDate, reminder.repeatEvery);
                                break;
                            case "months":
                                nextDate = addMonths(currentOnDate, reminder.repeatEvery);
                                break;
                            case "days":
                            default:
                                nextDate = addDays(currentOnDate, reminder.repeatEvery);
                                break;
                        }

                        // Update recurring reminder to the next date and reset triggered
                        await prisma.contactReminder.update({
                            where: { id: reminder.id },
                            data: {
                                onDate: format(nextDate, "yyyy-MM-dd"),
                                triggered: false,
                                delivered: false // Reset delivery status for next run
                            }
                        });
                    } else {
                        // One-time reminder: mark as triggered
                        await prisma.contactReminder.update({
                            where: { id: reminder.id },
                            data: { triggered: true }
                        });
                    }

                    results.push({ id: reminder.id, status: "success" });
                } catch (err: any) {
                    console.error(`[ReminderService] Failed to send reminder ${reminder.id}:`, err.message);
                    results.push({ id: reminder.id, status: "error", message: err.message });

                    // Still mark as triggered to avoid infinite loops on bad templates for one-time ones
                    if (reminder.scheduleType !== "repeated") {
                        await prisma.contactReminder.update({
                            where: { id: reminder.id },
                            data: { triggered: true }
                        });
                    }
                }
            }

            return {
                status: "success",
                sent: results.length,
                results
            };
        } catch (error) {
            console.error("[ReminderService] CRITICAL ERROR:", error);
            throw error;
        }
    }
}
