"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Filter, Eye, Edit2, Trash2, Calendar, Clock, Bell, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { ReminderContent } from "@/components/reminders/ReminderContent";
import "@/app/reminder/reminder.css";

import { ArrowLeft } from "lucide-react";


export default function ReminderContactsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromInbox = searchParams.get("from") === "inbox";

  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    thisWeek: 0,
    upcoming: 0
  });

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Fetch reminders from backend
  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/contact-reminders/list");

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to fetch reminders");
      }

      const data = await response.json();

      // Transform data to match component structure
      const transformedData = data.map((reminder: any) => ({
        id: reminder.id,
        name: reminder.contactName || "Unknown",
        date: reminder.onDate || new Date().toISOString().split('T')[0],
        time: reminder.allDay ? "All Day" : `${reminder.fromTime || "00:00"} - ${reminder.toTime || "00:00"}`,
        reminderName: reminder.templateName || "Custom Reminder",
        scheduleType: reminder.scheduleType,
        contactPhone: reminder.contactPhone,
        delivered: reminder.delivered,
        triggered: reminder.triggered
      }));

      setContacts(transformedData);

      // Calculate stats
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const thisWeekCount = transformedData.filter((r: any) => {
        const reminderDate = new Date(r.date);
        return reminderDate >= now && reminderDate <= weekFromNow;
      }).length;

      const upcomingCount = transformedData.filter((r: any) => {
        const reminderDate = new Date(r.date);
        return reminderDate > weekFromNow;
      }).length;

      setStats({
        total: transformedData.length,
        thisWeek: thisWeekCount,
        upcoming: upcomingCount
      });
    } catch (error) {
      console.error("Error fetching reminders:", error);
      alert("Failed to load reminders");
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(
    (contact: any) =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.reminderName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleView = (id: number) => {
    console.log("View reminder:", id);
    // router.push(`/reminder/${id}`);
  };

  const handleEdit = (id: number) => {
    console.log("Edit reminder:", id);
    // router.push(`/reminder/edit/${id}`);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this reminder?")) {
      try {
        const response = await fetch(`/api/contact-reminders/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error("Failed to delete reminder");
        }

        await fetchReminders(); // Refresh data
        alert("Reminder deleted successfully");
      } catch (error) {
        console.error("Error deleting reminder:", error);
        alert("Failed to delete reminder");
      }
    }
  };

  if (loading) {
    return (
      <div className="reminder-container">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="stats-card skeleton h-32 rounded-2xl"></div>
            <div className="stats-card skeleton h-32 rounded-2xl"></div>
            <div className="stats-card skeleton h-32 rounded-2xl"></div>
          </div>

          <div className="skeleton h-80 rounded-xl"></div>
        </div>
      </div>
    );
  }


  return (
    <div className="reminder-container">
      <div className="max-w-[1600px] mx-auto">

        {/* HEADER */}
        <div className="mb-8 flex-shrink-0">
          {fromInbox && (
            <button
              onClick={() => router.push("/inbox")}
              className="flex items-center gap-2 mb-4 text-emerald-600 hover:text-emerald-700 font-medium"
            >
              <ArrowLeft size={18} />
              Back to Inbox
            </button>
          )}
          <div className="flex items-center gap-3 mb-3">
            <div
              className="p-3 rounded-xl shadow-lg"
              style={{
                background: "linear-gradient(to bottom right, #10b981, #6ee7b7)",
              }}
            >
              <Bell className="w-6 h-6 text-white" />

            </div>
            <h1 className="text-4xl font-bold">Reminders</h1>
          </div>
          <p className="text-lg ml-1">
            Manage all your reminder records efficiently
          </p>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 flex-shrink-0">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-600 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex flex-col items-center text-center gap-4">
              <div
                className="p-4 rounded-xl shadow-lg"
                style={{ background: "linear-gradient(135deg, #10b981 0%, #6ee7b7 100%)" }}
              >
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-300 mb-2">Total Reminders</p>
                <p className="text-4xl font-bold text-gray-900 dark:text-gray-50">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-600 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex flex-col items-center text-center gap-4">
              <div
                className="p-4 rounded-xl shadow-lg"
                style={{ background: "linear-gradient(135deg, #34d399 0%, #a7f3d0 100%)" }}
              >
                <Clock className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-300 mb-2">This Week</p>
                <p className="text-4xl font-bold text-gray-900 dark:text-gray-50">{stats.thisWeek}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-600 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex flex-col items-center text-center gap-4">
              <div
                className="p-4 rounded-xl shadow-lg"
                style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)" }}
              >
                <Bell className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-300 mb-2">Upcoming</p>
                <p className="text-4xl font-bold text-gray-900 dark:text-gray-50">{stats.upcoming}</p>
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH + ACTION BUTTONS */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-4 py-2.5 border border-gray-200 dark:border-gray-600 w-[350px]">
            <Search className="text-gray-400 dark:text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 text-sm"
            />
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 
              text-gray-700 dark:text-gray-200 rounded-lg transition-colors text-sm border border-gray-200 dark:border-gray-600">
              <Filter size={16} />
              Filters
            </button>

            <button
              onClick={() => router.push("/reminder/create")}
              className="flex items-center gap-2 px-4 py-2.5 text-white rounded-lg transition-all duration-300 text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #6ee7b7 100%)",
              }}
            >
              <Plus size={16} />
              Create Reminder
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Reminder Name</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredContacts.length > 0 ? (
                  filteredContacts.map((contact: any) => (
                    <tr
                      key={contact.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300 font-semibold text-sm">
                            {contact.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{contact.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400 dark:text-gray-500" />
                          <span className="text-sm text-gray-700 dark:text-gray-200">{contact.date}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-gray-400 dark:text-gray-500" />
                          <span className="text-sm text-gray-700 dark:text-gray-200">{contact.time}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">{contact.reminderName}</span>
                          <span className={`text-[10px] uppercase font-bold mt-1 inline-block w-fit px-1.5 py-0.5 rounded ${contact.delivered
                              ? "bg-emerald-100 text-emerald-700"
                              : contact.triggered
                                ? "bg-amber-100 text-amber-700"
                                : "bg-gray-100 text-gray-600"
                            }`}>
                            {contact.delivered ? "Delivered" : contact.triggered ? "Processing" : "Pending"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleView(contact.id)}
                            className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleEdit(contact.id)}
                            className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(contact.id)}
                            className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">No reminders found. Create one to get started.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}