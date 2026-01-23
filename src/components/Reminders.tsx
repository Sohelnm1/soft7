"use client";

import { Clock, Plus, X } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import ReminderItem from "./ReminderItem";

interface Reminder {
  note: string;
  date: string;
  time: string;
  triggered?: boolean;
}

export default function Reminders() {
  const [showReminders, setShowReminders] = useState(false);
  const [showNewReminder, setShowNewReminder] = useState(false);
  const [note, setNote] = useState("");
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const [activeTab, setActiveTab] = useState<"today" | "tomorrow">("today");
  const [remindersToday, setRemindersToday] = useState<Reminder[]>([
    {
      note: "Follow up with Client X",
      date: new Date().toISOString().split("T")[0],
      time: "10:00",
    },
  ]);
  const [remindersTomorrow, setRemindersTomorrow] = useState<Reminder[]>([]);
  const [popupReminder, setPopupReminder] = useState<Reminder | null>(null);

  // 🔊 Sound alert setup
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ensureAudioCtx = () => {
    if (!audioCtxRef.current) {
      const Ctx =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new Ctx();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  };

  const playChime = () => {
    try {
      const ctx = ensureAudioCtx();
      const now = ctx.currentTime;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      gain.connect(ctx.destination);

      const osc1 = ctx.createOscillator();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(659.25, now);
      const osc2 = ctx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(987.77, now);
      osc1.connect(gain);
      osc2.connect(gain);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.55);
      osc2.stop(now + 0.55);
    } catch (e) {
      // ignore if audio fails (browser restrictions)
    }
  };

  // ➕ Add reminder
  const handleAddReminder = () => {
    if (!note.trim() || !time) return;
    const today = new Date().toISOString().split("T")[0];
    const newReminder: Reminder = {
      note,
      date: date || today,
      time,
      triggered: false,
    };
    if (newReminder.date === today)
      setRemindersToday((prev) => [...prev, newReminder]);
    else setRemindersTomorrow((prev) => [...prev, newReminder]);
    setNote("");
    setTime("");
    setDate("");
    setShowNewReminder(false);
  };

  const remindersCount = remindersToday.length + remindersTomorrow.length;

  // ⏰ Check reminder time
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentDate = now.toISOString().split("T")[0];
      const currentTime = now.toTimeString().slice(0, 5);

      const maybeTrigger = (r: Reminder) => {
        if (!r.triggered && r.date === currentDate && r.time === currentTime) {
          r.triggered = true;
          setPopupReminder({ ...r });
        }
        return r;
      };

      setRemindersToday((prev) => prev.map(maybeTrigger));
      setRemindersTomorrow((prev) => prev.map(maybeTrigger));
    };

    checkReminders();
    const id = setInterval(checkReminders, 30 * 1000);
    return () => clearInterval(id);
  }, []);

  // 🔊 Play sound on popup
  useEffect(() => {
    if (popupReminder) playChime();
  }, [popupReminder]);

  return (
    <>
      {/* Reminder Button */}
      <div className="relative">
        <button
          onClick={() => setShowReminders(!showReminders)}
          className="relative p-2 rounded-full text-gray-600 hover:bg-gray-100 hover:ring-2 hover:ring-indigo-100 transition duration-150"
        >
          <Clock className="h-5 w-5 text-green-500" />
          <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] font-bold rounded-full px-1.5 border border-white shadow-sm">
            {remindersCount}
          </span>
        </button>

        {/* Dropdown */}
        {showReminders && (
          <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-gray-900 shadow-xl rounded-xl border border-gray-100 dark:border-gray-700 z-50">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-800 dark:text-gray-100">
                  Remind Me
                </h3>
                <img
                  src="/bell-icon.png"
                  alt="Bell"
                  className="w-5 h-5 object-contain opacity-80 hover:opacity-100 transition"
                />
              </div>
              <button
                onClick={() => setShowNewReminder(true)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-800 dark:text-gray-100 transition duration-150"
                aria-label="Create new reminder"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
              <div className="flex w-full rounded-lg overflow-hidden text-sm font-medium">
                <button
                  onClick={() => setActiveTab("today")}
                  className={`flex-1 py-1.5 ${
                    activeTab === "today"
                      ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-inner border border-gray-200 dark:border-gray-600"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                  } transition`}
                >
                  Today
                </button>
                <button
                  onClick={() => setActiveTab("tomorrow")}
                  className={`flex-1 py-1.5 ${
                    activeTab === "tomorrow"
                      ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-inner border border-gray-200 dark:border-gray-600"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                  } transition`}
                >
                  Tomorrow
                </button>
              </div>
            </div>

            {/* Reminder List */}
            <div className="p-4 max-h-60 overflow-y-auto">
              {activeTab === "today"
                ? remindersToday.length === 0
                  ? (
                    <p className="text-center text-gray-400 dark:text-gray-500 py-4">
                      No reminders for today
                    </p>
                    )
                  : remindersToday.map((r, i) => (
                      <ReminderItem key={i} reminder={r} />
                    ))
                : remindersTomorrow.length === 0
                ? (
                  <p className="text-center text-gray-400 dark:text-gray-500 py-4">
                    No reminders for tomorrow
                  </p>
                  )
                : remindersTomorrow.map((r, i) => (
                    <ReminderItem key={i} reminder={r} />
                  ))}
            </div>
          </div>
        )}
      </div>

      {/* ✅ Create Reminder Modal */}
      {showNewReminder &&
        createPortal(
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]">
            <div className="bg-white dark:bg-gray-900 w-96 p-6 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  Create New Reminder
                </h2>
                <button
                  onClick={() => setShowNewReminder(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">
                    Note
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Enter your reminder note..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-indigo-400"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">
                      Date
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">
                      Time
                    </label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleAddReminder}
                    className="flex-1 bg-indigo-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-600 transition"
                  >
                    Submit
                  </button>
                  <button
                    onClick={() => setShowNewReminder(false)}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ✅ Small Bottom-right Reminder Notification */}
{popupReminder &&
  createPortal(
    <div className="fixed bottom-4 right-4 z-[99999] animate-in fade-in slide-in-from-bottom-2">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl w-80 overflow-hidden">
        
        {/* GREEN HEADER */}
        <div className="bg-[#0F9D58] text-white px-4 py-2 flex justify-between items-center">
          <h3 className="font-semibold text-sm">Reminder</h3>
          <button
            onClick={() => setPopupReminder(null)}
            className="text-white/80 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex">
          
          {/* LEFT GREEN STRIP */}
          <div className="w-2 bg-[#D1FAE5] dark:bg-green-700" />

          {/* MESSAGE BOX */}
          <div className="flex-1 px-4 py-3">
            <div className="bg-[#D1FAE5] dark:bg-green-700 p-3 rounded-md">
              <p className="text-sm text-gray-800 dark:text-gray-100">
                {popupReminder.note}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
                {popupReminder.time}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>,
    document.body
  )}


    </>
  );
}
