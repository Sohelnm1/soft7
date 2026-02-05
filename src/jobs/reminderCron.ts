import cron from "node-cron";
import { ReminderService } from "../services/reminder.service";

/**
 * Background job that runs every minute to check for pending contact reminders.
 */
export function initReminderCron() {
    console.log("⏰ Initializing Reminder Cron Job (Every 1 minute)");

    cron.schedule("* * * * *", async () => {
        try {
            const result = await ReminderService.runDueReminders();
            if (result.sent > 0) {
                console.log(`[ReminderCron] Processed ${result.sent} reminders.`);
            }
        } catch (err) {
            console.error("[ReminderCron] Error in execution:", err);
        }
    });
}
