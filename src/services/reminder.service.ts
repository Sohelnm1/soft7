import { prisma } from "../lib/prisma";
import { TemplateService } from "./template.service";

export class ReminderService {
    /**
     * Checks for due reminders and sends them using TemplateService.
     */
    static async runDueReminders() {
        const now = new Date();
        const currentDate = now.toISOString().split("T")[0]; // yyyy-mm-dd
        const currentTime = now.toTimeString().slice(0, 5);  // HH:MM

        console.log(`[ReminderService] Checking reminders for ${currentDate} ${currentTime}`);

        try {
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

            if (dueReminders.length === 0) return { status: "success", sent: 0 };

            const results = [];
            for (const reminder of dueReminders) {
                try {
                    const r = reminder as any;
                    if (!r.templateName) {
                        console.warn(`[ReminderService] Reminder ${reminder.id} has no templateName, skipping.`);
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

                    await prisma.contactReminder.update({
                        where: { id: reminder.id },
                        data: { triggered: true }
                    });

                    results.push({ id: reminder.id, status: "success" });
                } catch (err: any) {
                    console.error(`[ReminderService] Failed to send reminder ${reminder.id}:`, err.message);
                    results.push({ id: reminder.id, status: "error", message: err.message });

                    await prisma.contactReminder.update({
                        where: { id: reminder.id },
                        data: { triggered: true }
                    });
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
