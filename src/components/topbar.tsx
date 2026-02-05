// components/topbar.tsx
"use client";

import {
  Menu,
  Search,
  Clock,
  X,
  User,
  Settings,
  CreditCard,
  LogOut,
  Plus,
  Bell,
  Tag,
  MessageSquare,
  FileText,
  Users,
  Crown,
} from "lucide-react";
import "./profile.css";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import Link from "next/link";
import Notifications from "./notifications/Notifications";
import ReminderItem from "./reminders/ReminderItem";
import SubscriptionPanel from "./subscription/SubscriptionPanel";
import useSWR from "swr";

/* -----------------------------------------------------------------
   Types
   ----------------------------------------------------------------- */
interface Reminder {
  id: string;
  creatorId: string;
  assigneeId?: number;
  note: string;
  date: string;
  time: string;
  triggered: boolean;
}

type SearchResult = {
  id: string | number;
  type:
  | "contact"
  | "page"
  | "campaign"
  | "tag"
  | "lead"
  | "media"
  | "flow"
  | "chatbot"
  | "ai-assistant"
  | "webhook"
  | "column"
  | "opt-keyword"
  | "whatsapp-flow"
  | "faq-bot"
  | "reminder"
  | "team-member";
  title: string;
  subtitle?: string;
  url: string;
  icon?: React.ReactNode;
}

interface SubscriptionData {
  plan: string;
  startDate: string;
  endDate: string;
  status: string;
  stats?: {
    leadsAdded: number;
    campaignsRun: number;
    contactsManaged: number;
  }
}

/* -----------------------------------------------------------------
   SSR-safe today string
   ----------------------------------------------------------------- */
const todayStr =
  typeof window !== "undefined"
    ? new Date().toISOString().split("T")[0]
    : "";
const tomorrow = typeof window !== "undefined" ? new Date() : null;
if (tomorrow) tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowStr = tomorrow ? tomorrow.toISOString().split("T")[0] : "";

/* -----------------------------------------------------------------
   Fetcher
   ----------------------------------------------------------------- */
const fetcher = async (url: string) => {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to fetch");
  const json = await res.json();
  return json.data;
};

/* -----------------------------------------------------------------
   Singleton AudioContext
   ----------------------------------------------------------------- */
let audioCtx: AudioContext | null = null;
const getAudioContext = (): AudioContext => {
  if (!audioCtx) {
    interface Window {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    }

    const AudioCtx =
      window.AudioContext ||
      (window as Window & typeof globalThis).webkitAudioContext;

    if (!AudioCtx) throw new Error("Web Audio API not supported");
    audioCtx = new AudioCtx();
    const resumeOnInteraction = () => {
      audioCtx?.resume().catch(() => { });
      document.removeEventListener("click", resumeOnInteraction);
      document.removeEventListener("touchstart", resumeOnInteraction);
    };
    document.addEventListener("click", resumeOnInteraction);
    document.addEventListener("touchstart", resumeOnInteraction);
  }
  return audioCtx!;
};

/* -----------------------------------------------------------------
   Topbar Component
   ----------------------------------------------------------------- */
export function Topbar() {
  /* User & UI state */
  const [userData, setUserData] = useState<{
    id: string;
    name: string;
    image?: string;
    walletBalance?: number;
  }>({ id: "", name: "" });
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [openReminders, setOpenReminders] = useState(false);
  const [cnt, setCntNotifications] = useState(0);
  const profileRef = useRef<HTMLDivElement>(null);
  const remindersRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  /* Subscription state (no demo data here) */
  const [subscriptionData, setSubscriptionData] =
    useState<SubscriptionData | null>(null);
  const [showSubscriptionPanel, setShowSubscriptionPanel] = useState(false);

  /* Search state */
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  /* Reminder state */
  const [showRemindersDropdown, setShowRemindersDropdown] = useState(false);
  const [showNewReminder, setShowNewReminder] = useState(false);
  const [note, setNote] = useState("");
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [assigneeId, setAssigneeId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"today" | "tomorrow">("today");
  const [popupReminder, setPopupReminder] = useState<Reminder | null>(null);
  const [assignees, setAssignees] = useState<{ id: string; name: string }[]>(
    []
  );

  const [searchTerm, setSearchTerm] = useState("");

  /* Router & pathname */
  const pathname = usePathname() || "/";
  const router = useRouter();

  /* Fetch reminders */
  const { data: reminders, mutate: mutateReminders } = useSWR<Reminder[]>(
    "/api/reminders",
    fetcher
  );
  const remindersToday = reminders?.filter((r) => r.date === todayStr) || [];
  const remindersTomorrow =
    reminders?.filter((r) => r.date === tomorrowStr) || [];
  const remindersCount = remindersToday.length + remindersTomorrow.length;

  /* Fetch logged-in user */
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user");
        if (res.ok) {
          const data = await res.json();
          setUserData(data);
        }
      } catch (e) {
        console.error("Error fetching user:", e);
      }
    };
    fetchUser();
  }, []);

  /* Fetch subscription data (real API only) */
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const res = await fetch("/api/subscription", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setSubscriptionData(data);
        } else {
          setSubscriptionData(null);
        }
      } catch (e) {
        console.error("Error fetching subscription:", e);
        setSubscriptionData(null);
      }
    };
    fetchSubscription();
  }, []);

  /* Close profile menu on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Close search results on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Search functionality */
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(searchQuery)}`,
          {
            credentials: "include",
          }
        );

        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
          setShowSearchResults(true);
        }
      } catch (e) {
        console.error("Search error:", e);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(performSearch, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleResultClick = (result: SearchResult) => {
    router.push(result.url);
    setSearchQuery("");
    setShowSearchResults(false);
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case "contact":
        return <User className="h-4 w-4 text-blue-500" />;
      case "page":
        return <FileText className="h-4 w-4 text-green-500" />;
      case "campaign":
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      case "tag":
        return <Tag className="h-4 w-4 text-orange-500" />;
      case "lead":
        return <Users className="h-4 w-4 text-indigo-500" />;
      default:
        return <Search className="h-4 w-4 text-gray-500" />;
    }
  };

  /* Breadcrumb logic */
  const rawParts = pathname.split("/").filter(Boolean);
  const parts = rawParts.map(
    (p) => p.charAt(0).toUpperCase() + p.slice(1)
  );
  const breadcrumbItems: { label: string; href?: string; isLast?: boolean }[] =
    [];
  const isDashboardPage = pathname === "/" || pathname === "/dashboard";
  if (!isDashboardPage) {
    breadcrumbItems.push({ label: "Dashboard", href: "/dashboard" });
  }
  rawParts.forEach((_, idx) => {
    const cumulative = "/" + rawParts.slice(0, idx + 1).join("/");
    breadcrumbItems.push({ label: parts[idx], href: cumulative });
  });
  if (breadcrumbItems.length > 0) {
    breadcrumbItems[breadcrumbItems.length - 1].isLast = true;
  }
  const pageTitle = isDashboardPage
    ? "Dashboard"
    : breadcrumbItems[breadcrumbItems.length - 1]?.label ?? "Dashboard";

  /* Add reminder helper */
  const handleAddReminder = async () => {
    if (!note.trim() || !time) return;
    const newReminder: Omit<Reminder, "id" | "creatorId"> = {
      note,
      date: date || todayStr,
      time,
      triggered: false,
    };

    if (assigneeId) {
      newReminder.assigneeId = assigneeId;
    }
    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReminder),
      });
      if (res.ok) {
        mutateReminders();
        setNote("");
        setTime("");
        setDate("");
        setAssigneeId(null);
        setShowNewReminder(false);
      }
    } catch (e) {
      console.error("Error adding reminder:", e);
    }
  };

  const getUsers = async () => {
    try {
      const res = await fetch("/api/user/getUsers", {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to fetch users");

      const users = await res.json();
      setAssignees(await users.data);
      return users;
    } catch (e) {
      console.error("Error fetching users:", e);
    }
  };

  useEffect(() => {
    getUsers();
  }, []);

  /* Reminder trigger check */
  useEffect(() => {
    const check = async () => {
      const now = new Date();
      const curDate = now.toISOString().split("T")[0];
      const curTime = now.toTimeString().slice(0, 5);
      const allReminders = reminders || [];
      for (const r of allReminders) {
        if (!r.triggered && r.date === curDate && r.time === curTime) {
          setPopupReminder({ ...r });
          try {
            const res = await fetch(`/api/reminders/${r.id}`, {
              method: "PUT",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ triggered: true }),
            });
            if (!res.ok) console.error("Failed to update reminder");
          } catch (e) {
            console.error(e);
          }
        }
      }
      mutateReminders();
    };
    check();
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, [reminders, mutateReminders]);

  /* Play chime on popup */
  const playChime = () => {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    gain.connect(ctx.destination);
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = osc2.type = "sine";
    osc1.frequency.setValueAtTime(659.25, now);
    osc2.frequency.setValueAtTime(987.77, now);
    osc1.connect(gain);
    osc2.connect(gain);
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.55);
    osc2.stop(now + 0.55);
  };

  useEffect(() => {
    if (popupReminder) playChime();
  }, [popupReminder]);

  /* Close Reminders dropdown on outside click */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        remindersRef.current &&
        !remindersRef.current.contains(e.target as Node)
      ) {
        setShowRemindersDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* Close Notifications dropdown on outside click */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(e.target as Node)
      ) {
        setOpenReminders(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* Render */
  return (
    <>
      {/* =================== TOPBAR =================== */}
      <header className="sticky top-0 w-full h-16 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-700 flex items-center justify-between px-4 lg:px-6 shadow-md z-30 transition-colors duration-300">
        {/* LEFT: Breadcrumbs */}
        <div className="flex items-center gap-4">
          <button
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition md:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          <nav className="flex items-center gap-3 text-sm">
            {breadcrumbItems.length === 0 ? (
              <span className="font-semibold text-lg text-gray-800 dark:text-gray-100">
                {pageTitle}
              </span>
            ) : (
              breadcrumbItems.map((item, idx) => (
                <span key={idx} className="flex items-center">
                  {item.isLast ? (
                    <span className="font-semibold text-lg text-gray-800 dark:text-gray-100">
                      {item.label}
                    </span>
                  ) : (
                    <Link
                      href={item.href ?? "#"}
                      className="text-sm font-medium text-gray-500 hover:text-indigo-500 transition"
                    >
                      {item.label}
                    </Link>
                  )}
                  {idx < breadcrumbItems.length - 1 && (
                    <span className="mx-2 text-gray-300">/</span>
                  )}
                </span>
              ))
            )}
          </nav>
        </div>

        {/* MIDDLE: Search */}
        <div
          className="hidden md:flex flex-1 max-w-xl mx-6 relative"
          ref={searchRef}
        >
          <div
            className="relative w-full flex items-center border border-gray-300 dark:border-gray-600
               rounded-xl bg-white dark:bg-gray-800 shadow-inner
               focus-within:ring-2 focus-within:ring-indigo-400 transition"
          >
            <Search className="absolute left-4 text-gray-400 h-5 w-5 pointer-events-none" />

            <input
              type="text"
              value={searchQuery}
              placeholder="Search leads, campaigns, contacts, or pages..."
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              style={{ paddingLeft: "3rem" }}
              className="w-full px-3 py-2 text-sm bg-transparent
                 text-gray-800 dark:text-gray-100 outline-none"
            />

            {isSearching && (
              <div className="mr-4">
                <div className="animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full" />
              </div>
            )}
          </div>

          {/* 🔽 SEARCH RESULTS DROPDOWN */}
          {showSearchResults && searchResults.length > 0 && (
            <div
              className="absolute top-full mt-2 w-full bg-white dark:bg-gray-900
                 border border-gray-200 dark:border-gray-700
                 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto"
            >
              {searchResults.map((item) => (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleResultClick(item)}
                  className="w-full flex items-center gap-3 px-4 py-3
                     text-left hover:bg-gray-100 dark:hover:bg-gray-800
                     transition"
                >
                  <span className="shrink-0">
                    {getResultIcon(item.type)}
                  </span>

                  <div className="flex flex-col">
                    <span className="font-medium text-gray-800 dark:text-gray-100">
                      {item.title}
                    </span>

                    {item.subtitle && (
                      <span className="text-xs text-gray-500">
                        {item.subtitle}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Wallet Balance */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-lg">
            <CreditCard className="h-4 w-4 text-green-600 dark:text-green-400" />
            <div className="flex flex-col items-start leading-none">
              <span className="text-[10px] uppercase font-bold text-green-600/70 dark:text-green-400/70 tracking-tight">Credits</span>
              <span className="text-sm font-bold text-green-700 dark:text-green-300">
                ₹{userData.walletBalance?.toFixed(2) || "0.00"}
              </span>
            </div>
          </div>

          {/* Subscription Button */}
          <div className="relative group">
            <button
              onClick={() => setShowSubscriptionPanel(true)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-gradient-to-br hover:from-yellow-400 hover:to-orange-500 hover:text-white transition-all duration-300"
              aria-label="Subscription"
              title="Subscription"
            >
              <Crown className="h-5 w-5 text-yellow-500 group-hover:text-white dark:text-yellow-400 transition-colors" />
            </button>

          </div>


          {/* Notifications */}
          <button
            onClick={() => setOpenReminders(!openReminders)}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <Bell className="h-5 w-5 text-gray-500 dark:text-gray-300" />
            {cnt > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full border border-white" />
            )}
          </button>

          <div ref={notificationsRef}>
            {openReminders && <Notifications cnt={setCntNotifications} />}
          </div>

          {/* Reminders */}
          <div className="relative" ref={remindersRef}>
            <button
              onClick={() => setShowRemindersDropdown((v) => !v)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 hover:ring-2 hover:ring-indigo-200 transition"
            >
              <Clock className="h-5 w-5 text-indigo-500 dark:text-indigo-300" />
              {remindersCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[10px] font-bold rounded-full px-1.5 border border-white shadow-sm">
                  {remindersCount}
                </span>
              )}
            </button>

            {showRemindersDropdown && (
              <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-gray-900 shadow-xl rounded-xl border border-gray-100 dark:border-gray-700 z-50">
                {/* HEADER */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                  <h3 className="font-bold text-gray-800 dark:text-gray-100">
                    Remind Me
                  </h3>
                  <button
                    onClick={() => setShowNewReminder(true)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* TABS */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
                  <div className="flex w-full rounded-lg overflow-hidden text-sm font-medium">
                    <button
                      onClick={() => setActiveTab("today")}
                      className={`flex-1 py-1.5 ${activeTab === "today"
                        ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-inner border dark:border-gray-600"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                        }`}
                    >
                      Today
                    </button>

                    <button
                      onClick={() => setActiveTab("tomorrow")}
                      className={`flex-1 py-1.5 ${activeTab === "tomorrow"
                        ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-inner border dark:border-gray-600"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                        }`}
                    >
                      Tomorrow
                    </button>
                  </div>
                </div>

                {/* LIST */}
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

          {/* Profile */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setShowProfileMenu((p) => !p)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition shadow-sm"
            >
              <div className="h-9 w-9 rounded-full overflow-hidden flex items-center justify-center bg-gray-300 dark:bg-gray-700">
                {userData.image ? (
                  <img
                    src={userData.image}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-white font-semibold text-lg">
                    {userData.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {userData.name || "Loading..."}
              </span>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-50">
                <Link
                  href="/settings/profile"
                  className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <User size={16} /> Profile
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Settings size={16} /> Settings
                </Link>
                <Link
                  href="/settings/billing"
                  className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <CreditCard size={16} /> Billing
                </Link>
                <button
                  onClick={async () => {
                    await fetch("/api/auth/logout", {
                      method: "POST",
                    });

                    router.push("/"); // or /login
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* CREATE REMINDER MODAL */}
      {showNewReminder &&
        createPortal(
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]">
            <div className="bg-white dark:bg-gray-900 w-96 p-6 rounded-xl shadow-2xl border dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Create New Reminder</h2>
                <button onClick={() => setShowNewReminder(false)}>
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm mb-1 block">Note</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm mb-1 block">Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800"
                    />
                  </div>
                  <div>
                    <label className="text-sm mb-1 block">Time</label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full px-3 py-2 text-sm border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm mb-1 block">Assign to</label>
                  <select
                    value={assigneeId ?? ""}
                    onChange={(e) => setAssigneeId(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800"
                  >
                    <option value={userData.id}>Myself</option>
                    {assignees
                      .filter((u) => u.id !== userData.id)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleAddReminder}
                    className="flex-1 bg-indigo-500 text-white py-2 rounded-lg"
                  >
                    Submit
                  </button>
                  <button
                    onClick={() => setShowNewReminder(false)}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* SUBSCRIPTION PANEL */}
      {showSubscriptionPanel && (
        <SubscriptionPanel
          subscriptionData={subscriptionData}
          onClose={() => setShowSubscriptionPanel(false)}
        />
      )}
    </>
  );
}
