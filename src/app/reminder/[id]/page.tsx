"use client";

import { useState, useEffect, useRef } from "react";
import { Users, Tag, User, Phone, Send, List, ListOrdered, Type, X, Search, Calendar, Clock, Repeat2, ChevronRight } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import type { EmojiClickData } from "emoji-picker-react";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

const SCHEDULE_TYPES = [
  { id: "once", label: "Send Once" },
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
];

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function EditReminderPage() {
  const router = useRouter();
  const params = useParams();
  const reminderId = parseInt(params.id as string);

  const [message, setMessage] = useState("");

  // Scheduling States
  const [scheduleType, setScheduleType] = useState("once");
  const [onDate, setOnDate] = useState("");
  const [fromTime, setFromTime] = useState("09:00");
  const [toTime, setToTime] = useState("17:00");
  const [allDay, setAllDay] = useState(false);
  const [repeatEvery, setRepeatEvery] = useState(1);
  const [repeatUnit, setRepeatUnit] = useState("day");
  const [selectedDays, setSelectedDays] = useState<boolean[]>(Array(7).fill(false));

  // Contact Info
  const [contact, setContact] = useState<any>(null);

  // UI States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Toolbar States
  const [showEmoji, setShowEmoji] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch reminder on mount
  useEffect(() => {
    fetchReminder();
  }, [reminderId]);

  const fetchReminder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/contact-reminders/${reminderId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch reminder");
      }

      const data = await response.json();
      
      setMessage(data.message || "");
      setScheduleType(data.scheduleType || "once");
      setOnDate(data.onDate || "");
      setFromTime(data.fromTime || "09:00");
      setToTime(data.toTime || "17:00");
      setAllDay(data.allDay || false);
      setRepeatEvery(data.repeatEvery || 1);
      setRepeatUnit(data.repeatUnit || "day");
      
      if (data.selectedDays) {
        const daysArray = Array.isArray(data.selectedDays)
          ? data.selectedDays
          : typeof data.selectedDays === "string"
            ? JSON.parse(data.selectedDays)
            : [];
        setSelectedDays(daysArray);
      }
      
      setContact(data.contact);
      setError("");
    } catch (error) {
      console.error("Error fetching reminder:", error);
      setError(error instanceof Error ? error.message : "Failed to load reminder");
    } finally {
      setLoading(false);
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    const emoji = emojiData.emoji;
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const newMessage = message.slice(0, start) + emoji + message.slice(end);
      setMessage(newMessage);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(start + emoji.length, start + emoji.length);
          textareaRef.current.focus();
        }
      }, 0);
    }
  };

  const applyStyle = (style: "bold" | "italic") => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = message.slice(start, end);

    let formatted = selectedText;
    let cursorPosition = start;

    if (style === "bold") {
      formatted = `*${selectedText || ""}*`;
      cursorPosition = start + 1;
    }
    if (style === "italic") {
      formatted = `_${selectedText || ""}_`;
      cursorPosition = start + 1;
    }

    const newMessage = message.slice(0, start) + formatted + message.slice(end);
    setMessage(newMessage);

    setTimeout(() => {
      if (textareaRef.current) {
        if (selectedText) {
          textarea.setSelectionRange(start + formatted.length, start + formatted.length);
        } else {
          textarea.setSelectionRange(cursorPosition, cursorPosition);
        }
        textarea.focus();
      }
    }, 0);
  };

  const applyList = (type: "bullet" | "number") => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const lines = message.split("\n");

    let currentPos = 0;
    let startLine = 0;
    let endLine = 0;

    for (let i = 0; i < lines.length; i++) {
      const lineLength = lines[i].length + 1;
      if (currentPos <= start && start < currentPos + lineLength) {
        startLine = i;
      }
      if (currentPos <= end && end <= currentPos + lineLength) {
        endLine = i;
        break;
      }
      currentPos += lineLength;
    }

    const newLines = lines.map((line, i) => {
      if (i >= startLine && i <= endLine && line.trim() !== "") {
        if (type === "bullet") {
          return `• ${line.replace(/^[•\-\d+\.]\s*/, "")}`;
        } else if (type === "number") {
          const num = i - startLine + 1;
          return `${num}. ${line.replace(/^[•\-\d+\.]\s*/, "")}`;
        }
      }
      return line;
    });

    setMessage(newLines.join("\n"));

    setTimeout(() => {
      if (textareaRef.current) {
        textarea.focus();
      }
    }, 0);
  };

  const handleSave = async () => {
    setError("");
    setSaving(true);

    try {
      if (!message.trim()) {
        setError("Message is required");
        setSaving(false);
        return;
      }

      if (!onDate) {
        setError("Please select a date");
        setSaving(false);
        return;
      }

      if (!allDay && (!fromTime || !toTime)) {
        setError("Please select time range");
        setSaving(false);
        return;
      }

      if (scheduleType === "weekly" && selectedDays.every(d => !d)) {
        setError("Please select at least one day for weekly reminder");
        setSaving(false);
        return;
      }

      const updateData = {
        message: message.trim(),
        scheduleType,
        onDate,
        fromTime: allDay ? null : fromTime,
        toTime: allDay ? null : toTime,
        allDay,
        repeatEvery: scheduleType !== "once" ? repeatEvery : null,
        repeatUnit: scheduleType !== "once" ? repeatUnit : null,
        selectedDays: scheduleType === "weekly" ? selectedDays : null,
      };

      const response = await fetch(`/api/contact-reminders/${reminderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update reminder");
      }

      setSuccess("Reminder updated successfully!");
      setTimeout(() => {
        router.push("/reminder");
      }, 1500);
    } catch (error) {
      console.error("Error updating reminder:", error);
      setError(error instanceof Error ? error.message : "Failed to update reminder");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reminder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Edit Reminder</h1>
          <p className="text-gray-600 text-lg">
            Update reminder for <strong>{contact?.name}</strong>
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6">
            <h2 className="text-white font-semibold text-lg">Edit Reminder Details</h2>
            <p className="text-indigo-100 text-sm mt-0.5">Update the message and schedule</p>
          </div>

          <div className="p-8">
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                <h4 className="font-semibold text-gray-800 mb-2">Contact</h4>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-semibold">
                    {contact?.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{contact?.name}</p>
                    <p className="text-sm text-gray-600">{contact?.phone}</p>
                  </div>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Message</label>
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-xl border-2 border-gray-200 p-4 h-40 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all resize-none text-sm text-gray-700"
                  placeholder="Type your reminder message..."
                />

                {/* Toolbar */}
                <div className="relative mt-3 flex gap-2">
                  <button
                    onClick={() => setShowToolbar(!showToolbar)}
                    className={`p-2 rounded-lg shadow-md border-2 transition-all ${
                      showToolbar
                        ? "bg-indigo-500 text-white border-indigo-500"
                        : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300"
                    }`}
                  >
                    <Type size={16} />
                  </button>

                  {showToolbar && (
                    <div className="flex items-center gap-1 bg-white rounded-lg shadow-xl border-2 border-indigo-200 p-1.5">
                      <button
                        onClick={() => applyStyle("bold")}
                        className="p-1.5 hover:bg-indigo-100 rounded transition-all"
                        title="Bold"
                      >
                        <b className="text-gray-700 text-xs">B</b>
                      </button>
                      <button
                        onClick={() => applyStyle("italic")}
                        className="p-1.5 hover:bg-indigo-100 rounded transition-all"
                        title="Italic"
                      >
                        <span className="text-gray-700 text-xs italic font-serif">I</span>
                      </button>
                      <button
                        onClick={() => setShowEmoji(!showEmoji)}
                        className="p-1.5 hover:bg-indigo-100 rounded transition-all text-sm"
                      >
                        😊
                      </button>
                      <div className="w-px h-5 bg-gray-200 mx-1" />
                      <button
                        onClick={() => applyList("bullet")}
                        className="p-1.5 hover:bg-indigo-100 rounded transition-all"
                        title="Bullet List"
                      >
                        <List size={14} className="text-gray-700" />
                      </button>
                      <button
                        onClick={() => applyList("number")}
                        className="p-1.5 hover:bg-indigo-100 rounded transition-all"
                        title="Numbered List"
                      >
                        <ListOrdered size={14} className="text-gray-700" />
                      </button>
                    </div>
                  )}

                  {showEmoji && (
                    <div className="absolute z-50 top-12 left-0 shadow-2xl rounded-lg overflow-hidden">
                      <EmojiPicker onEmojiClick={onEmojiClick} width={280} height={320} />
                    </div>
                  )}
                </div>
              </div>

              {/* Schedule Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">Schedule Type</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {SCHEDULE_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setScheduleType(type.id)}
                      className={`py-2 px-3 rounded-lg font-medium text-sm transition-all border-2 ${
                        scheduleType === type.id
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300"
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Date</label>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-gray-500" />
                  <input
                    type="date"
                    value={onDate}
                    onChange={(e) => setOnDate(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* Time Settings */}
              <div>
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={allDay}
                    onChange={(e) => setAllDay(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600"
                  />
                  <span className="text-sm font-medium text-gray-700">All Day</span>
                </label>

                {!allDay && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Start Time</label>
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-gray-500" />
                        <input
                          type="time"
                          value={fromTime}
                          onChange={(e) => setFromTime(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">End Time</label>
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-gray-500" />
                        <input
                          type="time"
                          value={toTime}
                          onChange={(e) => setToTime(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Repeat Settings */}
              {scheduleType !== "once" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">Repeat Settings</label>
                  <div className="flex items-center gap-2 mb-4">
                    <Repeat2 size={16} className="text-gray-500" />
                    <select
                      value={repeatEvery}
                      onChange={(e) => setRepeatEvery(parseInt(e.target.value))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
                    >
                      {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                        <option key={n} value={n}>
                          Every {n} {repeatUnit}(s)
                        </option>
                      ))}
                    </select>
                  </div>

                  {scheduleType === "weekly" && (
                    <div>
                      <label className="text-xs text-gray-600 mb-2 block">Select Days</label>
                      <div className="grid grid-cols-4 gap-2">
                        {DAYS_OF_WEEK.map((day, idx) => (
                          <button
                            key={day}
                            onClick={() => {
                              const newDays = [...selectedDays];
                              newDays[idx] = !newDays[idx];
                              setSelectedDays(newDays);
                            }}
                            className={`py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                              selectedDays[idx]
                                ? "bg-indigo-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {day.slice(0, 3)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => router.push("/reminder")}
                  className="px-6 py-2.5 rounded-lg border-2 border-gray-300 hover:bg-gray-50 transition-all font-medium text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-white font-medium transition-all ${
                    saving
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-indigo-600 hover:shadow-lg hover:scale-105"
                  }`}
                >
                  {saving ? "Saving..." : "Save Changes"}
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
