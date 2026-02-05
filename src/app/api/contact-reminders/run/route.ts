import { NextResponse } from "next/server";
import { ReminderService } from "@/services/reminder.service";

export async function GET() {
  try {
    const result = await ReminderService.runDueReminders();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
  }
}
