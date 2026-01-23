"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Repeat,
  Sparkles,
  Users,
  ArrowLeft,
  Check,
  ChevronRight,
  ChevronLeft,
  Edit,
  Send,
} from "lucide-react";

type Recipient = { id: number | string; label: string; type: string };

export default function CreateReminderStep2() {
  const router = useRouter();

  const [draft, setDraft] = useState<{
    recipients: Recipient[];
    message: string;
    scheduleType?: "one" | "repeated" | "yourwish";
    date?: string;
    time?: string;
  }>(() => {
    try {
      const raw = localStorage.getItem("draftReminder");
      return raw ? JSON.parse(raw) : { recipients: [], message: "" };
    } catch {
      return { recipients: [], message: "" };
    }
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!draft.recipients || draft.recipients.length === 0 || !draft.message) {
      setTimeout(() => router.push("/reminder/create"), 200);
    }
  }, [draft, router]);

  const [activeTab, setActiveTab] = useState<"one" | "repeated" | "yourwish">(
    "one"
  );
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [allDay, setAllDay] = useState(false);
  const [onDate, setOnDate] = useState("");
  const [fromTime, setFromTime] = useState("09:00");
  const [toTime, setToTime] = useState("10:00");
  const [repeatEvery, setRepeatEvery] = useState(1);
  const [repeatUnit, setRepeatUnit] = useState("days");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [appliedType, setAppliedType] =
    useState<"one" | "repeated" | "yourwish" | null>(null);

  const scheduleOptions = [
    {
      id: "one" as const,
      label: "One-Time",
      icon: Calendar,
      description: "Send reminder once at specific time",
    },
    {
      id: "repeated" as const,
      label: "Repeated",
      icon: Repeat,
      description: "Send reminder on regular intervals",
    },
    {
      id: "yourwish" as const,
      label: "Custom",
      icon: Sparkles,
      description: "Create your own schedule pattern",
    },
  ];

  const daysOfWeek = ["M", "T", "W", "T", "F", "S", "S"];
  const daysFullName = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const generateCalendar = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevMonthDay = new Date(year, month, -i);
      days.unshift({ date: prevMonthDay.getDate(), isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: i, isCurrentMonth: true });
    }
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: i, isCurrentMonth: false });
    }
    return days;
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const handlePrevMonth = () => {
    setSelectedDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1)
    );
  };

  const handleNextMonth = () => {
    setSelectedDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1)
    );
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      day
    );
    setSelectedDate(newDate);
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, "0");
    const dateDay = String(newDate.getDate()).padStart(2, "0");
    const formattedDate = `${year}-${month}-${dateDay}`;
    setOnDate(formattedDate);
  };

  const handleSave = async () => {
    if (activeTab === "one" && !onDate) {
      alert("Please select a date");
      return;
    }
    if (activeTab === "repeated" && !onDate) {
      alert("Please select a date");
      return;
    }

    try {
      setSaving(true);

      const reminderData = {
        recipients: draft.recipients || [],
        message: draft.message || "",
        scheduleType: activeTab,
        allDay: activeTab === "one" ? allDay : false,
        onDate,
        fromTime: allDay ? null : fromTime,
        toTime: allDay ? null : toTime,
        repeatEvery: activeTab === "repeated" ? repeatEvery : null,
        repeatUnit: activeTab === "repeated" ? repeatUnit : null,
        selectedDays: activeTab === "repeated" ? selectedDays : null,
      };

      const response = await fetch("/api/contact-reminders/list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reminderData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create reminder");
      }

      const result = await response.json();

      localStorage.removeItem("draftReminder");

      alert(`Successfully created ${result.count} reminder(s)!`);

      router.push("/reminder");
    } catch (error) {
      console.error("Error creating reminder:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to create reminder. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    localStorage.removeItem("draftReminder");
    router.push("/reminder/create");
  };

  return (
    <div
      className="min-h-screen pb-20"
      style={{
        background:
          "radial-gradient(circle at 20% 20%, rgba(16, 185, 129, 0.12) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(52, 211, 153, 0.12) 0%, transparent 50%), linear-gradient(135deg, #e8f7ef 0%, #d1f3de 25%, #e8f7ef 50%, #c5eed9 75%, #e8f7ef 100%)",
        backgroundSize: "100% 100%, 100% 100%, 400% 400%",
      }}
    >
      <div className="max-w-5xl mx-auto p-4">
        {/* HEADER */}
        <div className="mb-4 px-2 animate-slideDown">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Choose when and how your reminder should be delivered
          </p>
        </div>

        {/* TOP ROW - Schedule Type Cards + Recipients */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          {scheduleOptions.map((option, index) => {
            const Icon = option.icon;
            const isActive = activeTab === option.id;
            const isApplied = appliedType === option.id;

            return (
              <button
                key={option.id}
                onClick={() => setActiveTab(option.id)}
                className={`relative p-3 rounded-lg transition-all duration-300 text-left animate-cardFadeIn hover:scale-105 hover:-translate-y-1 ${
                  isActive ? "shadow-lg" : "hover:shadow-md"
                }`}
                style={{
                  background: isActive
                    ? "rgba(255, 255, 255, 0.95)"
                    : "rgba(255, 255, 255, 0.6)",
                  backdropFilter: "blur(20px)",
                  border: `2px solid ${
                    isActive
                      ? "rgba(16, 185, 129, 0.3)"
                      : "rgba(16, 185, 129, 0.15)"
                  }`,
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                {isApplied && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shadow-md animate-numberPop">
                    <Check size={10} className="text-white" />
                  </div>
                )}
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 transition-all duration-300 animate-iconFloat`}
                  style={{
                    background: isActive
                      ? "linear-gradient(135deg, #10b981, #059669)"
                      : "rgba(229, 231, 235, 1)",
                    animationDelay: `${index * 0.15}s`,
                  }}
                >
                  <Icon
                    size={18}
                    className={isActive ? "text-white" : "text-gray-500"}
                  />
                </div>
                <h3 className="font-semibold text-sm mb-1 text-gray-500 dark:text-gray-400">
                  {option.label}
                </h3>
                <p className="text-xs leading-tight text-gray-500 dark:text-gray-400">
                  {option.description}
                </p>
              </button>
            );
          })}

          {/* Recipients Card */}
          <div
            className="p-3 rounded-lg shadow-md animate-cardFadeIn hover:scale-105 hover:-translate-y-1 transition-all duration-300"
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(20px)",
              border: "2px solid rgba(16, 185, 129, 0.2)",
              animationDelay: "0.3s",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shadow-md animate-iconFloat"
                style={{
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  animationDelay: "0.4s",
                }}
              >
                <Users size={18} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-500 dark:text-gray-400 mb-0.5">
                  Recipients
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {draft.recipients?.length || 0} selected
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              {draft.recipients?.slice(0, 1).map((r) => (
                <div
                  key={String(r.id)}
                  className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-xs text-emerald-700 dark:text-emerald-300 font-medium truncate"
                >
                  {r.label}
                </div>
              ))}
              {draft.recipients && draft.recipients.length > 1 && (
                <div className="px-2.5 py-1.5 rounded-lg text-xs text-gray-500 dark:text-gray-400 text-center font-medium">
                  +{draft.recipients.length - 1} more
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* LEFT COLUMN - Date & Time */}
          <div
            className="rounded-xl shadow-lg p-4 flex flex-col min-h-[400px] animate-slideUp hover:shadow-xl transition-all duration-300"
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(30px)",
              border: "2px solid rgba(16, 185, 129, 0.2)",
              animationDelay: "0.4s",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-500 dark:text-gray-400">
                Date & Time
              </h2>
              {activeTab === "one" && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    All Day
                  </span>
                  <button
                    onClick={() => setAllDay(!allDay)}
                    disabled={saving}
                    className={`relative w-11 h-6 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                      allDay
                        ? "bg-emerald-500"
                        : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 ${
                        allDay ? "left-5.5" : "left-0.5"
                      } w-5 h-5 rounded-full bg-white shadow-lg transition-all duration-300`}
                    />
                  </button>
                  <span
                    className={`text-xs font-bold ${
                      allDay
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {allDay ? "ON" : "OFF"}
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3">
                <label className="text-gray-500 dark:text-gray-400 font-medium w-12 text-sm">
                  ON
                </label>
                <input
                  type="date"
                  value={onDate}
                  onChange={(e) => setOnDate(e.target.value)}
                  disabled={saving}
                  className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-gray-500 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                />
              </div>
              {!allDay && (
                <>
                  <div className="flex items-center gap-3">
                    <label className="text-gray-500 dark:text-gray-400 font-medium w-12 text-sm">
                      From
                    </label>
                    <input
                      type="time"
                      value={fromTime}
                      onChange={(e) => setFromTime(e.target.value)}
                      disabled={saving}
                      className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-gray-500 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-gray-500 dark:text-gray-400 font-medium w-12 text-sm">
                      To
                    </label>
                    <input
                      type="time"
                      value={toTime}
                      onChange={(e) => setToTime(e.target.value)}
                      disabled={saving}
                      className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-gray-500 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    />
                  </div>
                </>
              )}
            </div>
            {activeTab === "repeated" && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 animate-fadeIn">
                <h3 className="text-base font-semibold text-gray-500 dark:text-gray-400 mb-3">
                  Repeat
                </h3>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Every
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={repeatEvery}
                    onChange={(e) =>
                      setRepeatEvery(parseInt(e.target.value) || 1)
                    }
                    disabled={saving}
                    className="w-16 px-2 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-gray-500 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  />
                  <select
                    value={repeatUnit}
                    onChange={(e) => setRepeatUnit(e.target.value)}
                    disabled={saving}
                    className="flex-1 px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-gray-500 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                </div>
                <div className="mb-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400 mb-2 block">
                    On
                  </span>
                  <div className="flex gap-1.5">
                    {daysOfWeek.map((day, idx) => (
                      <button
                        key={idx}
                        onClick={() => toggleDay(daysFullName[idx])}
                        disabled={saving}
                        className={`w-8 h-8 rounded-full text-xs font-semibold transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed ${
                          selectedDays.includes(daysFullName[idx])
                            ? "bg-emerald-500 text-white shadow-md"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="flex-1 px-4 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 font-medium text-gray-500 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2 text-sm rounded-lg text-white font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-105 hover:shadow-xl relative overflow-hidden group"
                style={{
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                }}
              >
                <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
                {saving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="relative z-10">Saving...</span>
                  </>
                ) : (
                  <span className="relative z-10">Save</span>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN - Calendar */}
          <div
            className="rounded-xl shadow-lg p-4 flex flex-col min-h-[400px] animate-slideUp hover:shadow-xl transition-all duration-300"
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(30px)",
              border: "2px solid rgba(16, 185, 129, 0.2)",
              animationDelay: "0.5s",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-500 dark:text-gray-400">
                {monthNames[selectedDate.getMonth()]}{" "}
                {selectedDate.getFullYear()}
              </h2>
              <div className="flex gap-1.5">
                <button
                  onClick={handlePrevMonth}
                  disabled={saving}
                  className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-emerald-400 dark:hover:border-emerald-500 flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110"
                >
                  <ChevronLeft
                    size={16}
                    className="text-gray-500 dark:text-gray-400"
                  />
                </button>
                <button
                  onClick={handleNextMonth}
                  disabled={saving}
                  className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-emerald-400 dark:hover:border-emerald-500 flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110"
                >
                  <ChevronRight
                    size={16}
                    className="text-gray-500 dark:text-gray-400"
                  />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-1.5"
                >
                  {day}
                </div>
              ))}
              {generateCalendar().map((day, idx) => {
                const today = new Date();
                const isToday =
                  day.isCurrentMonth &&
                  day.date === today.getDate() &&
                  selectedDate.getMonth() === today.getMonth() &&
                  selectedDate.getFullYear() === today.getFullYear();

                let dayDateString = "";
                if (day.isCurrentMonth) {
                  const year = selectedDate.getFullYear();
                  const month = String(
                    selectedDate.getMonth() + 1
                  ).padStart(2, "0");
                  const dateDay = String(day.date).padStart(2, "0");
                  dayDateString = `${year}-${month}-${dateDay}`;
                }
                const isSelected =
                  day.isCurrentMonth && onDate === dayDateString;

                return (
                  <button
                    key={idx}
                    onClick={() =>
                      day.isCurrentMonth && handleDateClick(day.date)
                    }
                    disabled={!day.isCurrentMonth || saving}
                    className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-300 hover:scale-110 ${
                      isSelected
                        ? "text-white shadow-lg scale-105"
                        : isToday
                        ? "bg-emerald-100 text-emerald-600 border border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-600"
                        : day.isCurrentMonth
                        ? "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                        : "text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    }`}
                    style={
                      isSelected
                        ? {
                            background:
                              "linear-gradient(135deg, #10b981, #059669)",
                          }
                        : {}
                    }
                  >
                    {day.date}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* BOTTOM RIGHT - Create Reminder Button */}
        <button
          onClick={handleSave}
          disabled={!onDate || saving}
          className={`fixed bottom-5 right-5 z-50 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-all duration-300 shadow-lg ${
            onDate && !saving
              ? "text-white hover:shadow-xl hover:scale-105"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          style={
            onDate && !saving
              ? {
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  boxShadow: "0 8px 24px rgba(16, 185, 129, 0.4)",
                }
              : {}
          }
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Send size={18} />
              Create Reminder
            </>
          )}
        </button>
      </div>
    </div>
  );
}