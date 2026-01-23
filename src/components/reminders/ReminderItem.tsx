"use client";

import React from "react";

interface Reminder {
  id: string;
  creatorId: string;
  assigneeId?: number;
  note: string;
  date: string;
  time: string;
  triggered: boolean;
}

export default function ReminderItem({ reminder }: { reminder: Reminder }) {
  return (
    <div className="flex items-start py-2 px-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition">
      <div className="h-2 w-2 bg-indigo-400 rounded-full mt-2 mr-3" />
      <p className="text-sm text-gray-700 dark:text-gray-300">
        {reminder.note} ({reminder.time})
      </p>
    </div>
  );
}
