"use client";
import React from "react";
import { ReminderContent } from "@/components/reminders/ReminderContent";
import FAQFlow from "@/components/FAQFlow";
import { useRouter } from "next/navigation";
import { TemplateSelectorModal } from "@/components/templates/TemplateSelectorModal";
import { TemplateMessage } from "@/components/TemplateMessage";
import { GalleryPickerModal } from "@/components/GalleryPickerModal";
import "./inbox-page.css";

import { useEffect, useState, useRef } from "react";
import {
  MessageSquare,
  Send,
  Check,
  CheckCheck,
  Paperclip,
  Mic,
  Phone,
  Video,
  MoreVertical,
  ArrowLeft,
  Users,
  CalendarDays,
  Layers,
  Tag,
  Bell,
  FileText,
  AlertCircle,
  Image,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axiosInstance";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

/* ---------- Types ---------- */
interface Contact {
  id: number;
  name: string;
  phone?: string | null;
  initials?: string;
  lastMessagePreview?: string | null;
  lastMessageTime?: string | null;
  unreadCount?: number;
}

interface Message {
  id: number;
  contactId: number;
  text: string;
  sentBy?: string;
  direction?: string;
  status?: string;
  senderId?: string;
  receiverId?: string;
  seen?: boolean;
  createdAt: string;
  from?: string;
  isTemplate?: boolean;
  templateComponents?: any;
  error?: string | null;
  errorCode?: string | null;
  mediaUrl?: string | null;
  mediaType?: string | null;
  messageType?: string | null;
}

interface ContactItemProps {
  contact: Contact;
  isSelected: boolean;
  onClick: () => void;
  reminders?: any[];
}

interface MessageFormInputs {
  message: string;
}

const PRIMARY_COLOR = "bg-emerald-600";
const PRIMARY_TEXT = "text-emerald-600";
const PRIMARY_HOVER = "hover:bg-emerald-700";

const buildInitials = (name?: string) => {
  if (!name) return "NA";
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

const iconJumpAnimation = `transition-transform duration-300 ease-in-out 
  hover:-translate-y-1 hover:scale-110 cursor-pointer text-gray-600 dark:text-gray-300`;

const isMyMessage = (msg: Message): boolean => {
  return msg.direction === "outgoing" || msg.sentBy === "me" || msg.sentBy === "campaign" || msg.senderId === "me" || msg.from === "me";
};

/* ---------- Component ---------- */
export default function InboxPage() {
  const queryClient = useQueryClient();
  const [activeFilter] = useState("All");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInboxMenu, setShowInboxMenu] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [recordingTime, setRecordingTime] = useState(0); // in seconds
  const [activeDropdown, setActiveDropdown] = useState<
    "Unread" | "Assigned" | "Unassigned" | null
  >(null);
  const [showTimeFilter, setShowTimeFilter] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState<
    "assignedTo" | "phoneNumbers" | "unreadTime" | null
  >(null);
  const assignedRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const unreadRef = useRef<HTMLDivElement>(null);
  const [showTimeRange, setShowTimeRange] = useState(false);
  const [activeIcon, setActiveIcon] = useState("CRM");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const dateRef = useRef<HTMLDivElement>(null);
  const inboxMenuRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // ⭐ FAQ Flow state
  const [showFAQFlow, setShowFAQFlow] = useState(false);
  const [selectedBotForFAQ] = useState<string | undefined>(undefined);

  // ⭐ Template Selector state
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  // ⭐ Gallery Picker state
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const [selectedGalleryMedia, setSelectedGalleryMedia] = useState<any>(null);
  const [isSendingMedia, setIsSendingMedia] = useState(false);

  const { register, watch, reset } = useForm<MessageFormInputs>({
    defaultValues: { message: "" },
  });
  const messageValue = watch("message");

  // Mark as Read Mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (contactId: number) => {
      await axiosInstance.post("/api/messages/mark-as-read", { contactId });
    },
    onSuccess: () => {
      // Refresh contacts to update unread counts
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    if ((contact.unreadCount ?? 0) > 0) {
      markAsReadMutation.mutate(contact.id);
    }
  };

  const sideBarMenuIcon = [
    {
      id: "CRM",
      icon: <Users size={22} className="cursor-pointer" />,
      label: "CRM",
    },
    {
      id: "Order Date",
      icon: <CalendarDays size={15} className="cursor-pointer" />,
      label: "Order Date",
    },
    {
      id: "Group",
      icon: <Layers size={22} className="cursor-pointer" />,
      label: "Group",
    },
    {
      id: "Tag",
      icon: <Tag size={22} className="cursor-pointer" />,
      label: "Tag",
    },
    {
      id: "Reminder",
      icon: <Bell size={22} className="cursor-pointer" />,
      label: "Reminder",
    },
  ];

  /* ---------- Load contacts + compute preview/unread ---------- */
  const { data: contacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/api/contacts");
      return data;
    },
    select: (rawContacts) => {
      return rawContacts.map((c: any) => ({
        id: c.id,
        name: c.name,
        phone: c.phone ? c.phone.replace(/\D/g, "") : c.phone,
        initials: buildInitials(c.name),
        lastMessagePreview: c.last_message_preview || c.lastMessagePreview || null,
        lastMessageTime: c.lastMessageTime || null, // Keeping the raw ISO string for local formatting
        unreadCount: c.unread_count || c.unreadCount || 0,
      }));
    },
  });

  const { data: reminders = [] } = useQuery({
    queryKey: ["reminders"],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/api/contact-reminders/list");
      return data;
    },
  });

  /* ---------- Filter handling ---------- */

  const filteredContacts = contacts.filter((c: any) => {
    const q = searchQuery.trim().toLowerCase();

    // Logic for the Search Query
    const matchesSearch =
      !q || c.name.toLowerCase().includes(q) || (c.phone ?? "").includes(q);

    // Logic for the Active Filter (Fixed to handle "All")
    const matchesFilter =
      activeFilter === "All" ||
      c.name.toLowerCase().includes(activeFilter.toLowerCase());

    return matchesSearch && matchesFilter;
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", selectedContact?.id],
    queryFn: async () => {
      if (!selectedContact) return [];
      const { data } = await axiosInstance.get(
        `/api/messages?contactId=${selectedContact?.id}`
      );
      return data;
    },
    enabled: !!selectedContact,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await axiosInstance.post("/api/messages", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["messages", selectedContact?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      reset();
      setSelectedFile(null);
      setAudioBlob(null);
      setRecordingTime(0);
      toast.success("Message sent successfully!");
    },
    onError: (error: any) => {
      console.error("Failed to send message:", error);
      toast.error(error?.response?.data?.message || "Failed to send message");
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ---------- Close attach menu when clicking outside ---------- */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (showAttachMenu) {
        const attachMenu = document.querySelector(".attach-menu");
        const attachButton = document.querySelector(".attach-button");
        if (
          attachMenu &&
          !attachMenu.contains(target) &&
          !attachButton?.contains(target)
        ) {
          setShowAttachMenu(false);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAttachMenu]);

  /* ---------- Handle file selection ---------- */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
      setShowAttachMenu(false);
    }
  };

  /* ---------- Voice Recording Functions ---------- */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Try Meta-supported formats first, fallback to webm
      let mimeType = 'audio/webm';
      const supportedFormats = [
        'audio/ogg;codecs=opus',  // Preferred: OGG with OPUS (Meta supports)
        'audio/mp4',              // MP4 audio (M4A equivalent)
        'audio/mpeg',             // MP3
        'audio/webm;codecs=opus', // WebM with OPUS (needs server conversion)
        'audio/webm',             // WebM default (needs server conversion)
      ];

      for (const format of supportedFormats) {
        if (MediaRecorder.isTypeSupported(format)) {
          mimeType = format;
          console.log('Recording with format:', mimeType);
          break;
        }
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        // Use the actual mimeType from recording
        const audioBlob = new Blob(audioChunks, { type: mimeType });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setAudioBlob(null);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  /* ---------- Send message ---------- */
  const handleSend = async () => {
    if (!selectedContact) return;
    if (!messageValue.trim() && !selectedFile && !audioBlob && !selectedGalleryMedia) return;

    // Handle media sending (file, audio, or gallery)
    if (selectedFile || audioBlob || selectedGalleryMedia) {
      setIsSendingMedia(true);
      try {
        const formData = new FormData();
        formData.append("contactId", selectedContact.id.toString());

        if (messageValue.trim()) {
          formData.append("caption", messageValue.trim());
        }

        if (selectedGalleryMedia) {
          // Send from gallery
          formData.append("galleryMediaId", selectedGalleryMedia.id.toString());
        } else if (selectedFile) {
          // Upload new file
          formData.append("file", selectedFile);
        } else if (audioBlob) {
          // Upload audio recording
          const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: "audio/webm" });
          formData.append("file", audioFile);
        }

        const response = await axiosInstance.post("/api/messages/send-media", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (response.data.success) {
          toast.success("Media sent successfully!");
          queryClient.invalidateQueries({ queryKey: ["messages", selectedContact.id] });
          queryClient.invalidateQueries({ queryKey: ["contacts"] });
          reset();
          setSelectedFile(null);
          setAudioBlob(null);
          setRecordingTime(0);
          setSelectedGalleryMedia(null);
        }
      } catch (error: any) {
        console.error("Failed to send media:", error);
        toast.error(error?.response?.data?.error || "Failed to send media");
      } finally {
        setIsSendingMedia(false);
      }
      return;
    }

    // Text-only message
    await sendMessageMutation.mutateAsync({
      contactId: selectedContact.id,
      text: messageValue.trim(),
    });
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        inboxMenuRef.current &&
        !inboxMenuRef.current.contains(e.target as Node)
      ) {
        setShowInboxMenu(false);
        setActiveSubMenu(null);
        setShowTimeRange(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const MessageStatus = ({
    status,
    direction,
    error,
    readAt,
    deliveredAt,
  }: {
    status?: string;
    direction?: string;
    error?: string | null;
    readAt?: any;
    deliveredAt?: any;
  }) => {
    if (direction !== "outgoing") return null;

    const isRead = status === "read" || !!readAt;
    const isDelivered = status === "delivered" || !!deliveredAt || isRead;

    if (isRead) {
      return <CheckCheck size={14} className="text-emerald-500 ml-0.5" />;
    }
    if (isDelivered) {
      return <CheckCheck size={14} className="text-slate-500 ml-0.5" />;
    }
    if (status === "failed") {
      return (
        <span
          title={error || "Message delivery failed"}
          className="ml-1 cursor-help flex items-center group/fail"
        >
          <AlertCircle size={14} className="text-red-600 animate-pulse transition-transform hover:scale-110" />
        </span>
      );
    }
    return <Check size={14} className="text-slate-400 ml-0.5" />;
  };

  const getContactReminders = (contactId: number) =>
    reminders.filter((r: any) => r.contactId === contactId);

  const ContactItem = ({
    contact,
    isSelected,
    onClick,
    reminders: contactReminders = [],
  }: ContactItemProps) => (
    <div
      onClick={onClick}
      className={`contact-item flex flex-col cursor-pointer transition-all duration-200 ${isSelected
        ? "selected"
        : "bg-transparent"
        }`}
    >
      {/* Main contact row */}
      <div className="flex items-center justify-between p-2">
        <div className="flex items-center gap-3 flex-1">
          <div className="contact-avatar w-12 h-12 rounded-full flex items-center justify-center font-bold text-white">
            {contact.initials}
          </div>

          <div className="flex-1">
            <p className={`text-sm ${contact.unreadCount && contact.unreadCount > 0 ? "font-bold text-gray-900 dark:text-white" : "font-semibold text-gray-700 dark:text-gray-200"}`}>
              {contact.name}
            </p>
            {contact.lastMessagePreview && (
              <p className={`text-xs truncate max-w-[180px] ${contact.unreadCount && contact.unreadCount > 0 ? "font-medium text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"}`}>
                {contact.lastMessagePreview}
              </p>
            )}
            {!contact.lastMessagePreview && contact.phone && (
              <p className="text-xs text-gray-500">{contact.phone}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <span className={`text-[10px] ${contact.unreadCount && contact.unreadCount > 0 ? "font-bold text-emerald-600" : "text-gray-400"}`}>
            {contact.lastMessageTime ? new Date(contact.lastMessageTime).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }) : "N/A"}
          </span>

          {(contact.unreadCount ?? 0) > 0 && (
            <span className="bg-emerald-500 text-white text-[10px] font-bold min-w-[20px] h-[20px] px-1.5 flex items-center justify-center rounded-full shadow-sm animate-in zoom-in duration-300">
              {contact.unreadCount}
            </span>
          )}
        </div>
      </div>

      {/* Reminders row */}
      {contactReminders.length > 0 && (
        <div className="px-4 pb-3 space-y-1">
          {contactReminders.slice(0, 2).map((reminder, idx) => (
            <div
              key={`${contact.id}-reminder-${idx}`}
              className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700"
            >
              <Bell
                size={12}
                className="text-amber-600 dark:text-amber-400 mt-0.5"
              />

              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                  {reminder.message?.substring(0, 40)}
                  {reminder.message?.length > 40 ? "..." : ""}
                </p>

                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {new Date(reminder.onDate).toLocaleDateString()} at{" "}
                  {reminder.fromTime || "All Day"}
                </p>
              </div>
            </div>
          ))}

          {contactReminders.length > 2 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 px-2">
              +{contactReminders.length - 2} more reminders
            </p>
          )}
        </div>
      )}
    </div>
  );

  const isChatVisible =
    !!selectedContact ||
    (typeof window !== "undefined" && window.innerWidth >= 768);
  const isSidebarHiddenOnMobile =
    !isMobileSidebarOpen &&
    typeof window !== "undefined" &&
    window.innerWidth < 768;

  useEffect(() => {
    const syncMobileState = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        setIsMobileSidebarOpen(!selectedContact);
      } else {
        setIsMobileSidebarOpen(true);
      }
    };

    syncMobileState();
    window.addEventListener("resize", syncMobileState);
    return () => window.removeEventListener("resize", syncMobileState);
  }, [selectedContact]);

  /* ---------- Render ---------- */
  return (
    <div
      className="inbox-page h-[calc(100vh-132px)] md:h-[calc(100vh-120px)] w-full overflow-hidden bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm grid grid-cols-1 md:grid-cols-[72px_360px_minmax(0,1fr)] min-h-0"
    >
      {/* Left Icon Sidebar */}
      {activeIcon === "Reminder" ? (
        <div className="flex-1 bg-white dark:bg-gray-900 overflow-y-auto absolute inset-0">
          <ReminderContent />
        </div>
      ) : (
        <>
          <div
            className="icon-sidebar hidden md:flex flex-col items-center gap-4 px-2 py-4 bg-emerald-50 dark:bg-slate-900 border-r border-slate-200/60 dark:border-slate-800/80 relative z-10"
          >
            <span className="text-xs font-semibold text-white dark:text-gray-300 mb-8 mt-6"></span>
            {sideBarMenuIcon.map((item) => (
              <div
                key={item.id}
                className="icon-container relative group flex justify-center"
              >
                <button
                  onClick={() => {
                    if (item.id === "Reminder") {
                      router.push("/reminder?from=inbox");
                    } else {
                      setActiveIcon(item.id);
                    }
                  }}
                  className={`icon-button flex items-center justify-center w-11 h-11 rounded-xl transition-colors duration-200
                    ${activeIcon === item.id ? "active" : ""}`}
                >
                  {React.cloneElement(item.icon, { title: "" })}
                </button>

                {/* Tooltip */}
                <div className="icon-tooltip">{item.label}</div>
              </div>
            ))}
          </div>

          {/* Inbox and Chat */}
          <div
            className={`contacts-sidebar relative z-5 md:col-start-2 md:row-start-1 md:w-[360px]
              ${isChatVisible &&
                typeof window !== "undefined" &&
                window.innerWidth < 768
                ? "hidden"
                : "block"
              }`}
          >
            {/* Contacts Sidebar */}
            <div
              className={`contacts-sidebar w-full flex flex-col h-full ${isChatVisible &&
                typeof window !== "undefined" &&
                window.innerWidth < 768
                ? "hidden"
                : "block"
                }`}
            >
              {/* Header Section */}
              <div className="contacts-header px-4 h-16 flex items-center justify-between">
                <span className="text-base font-semibold">Inbox</span>

                {/* Right side — Dropdown */}
                <div className="relative ml-auto">
                  <button
                    onClick={() => setShowInboxMenu(!showInboxMenu)}
                    className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <MoreVertical className="cursor-pointer" />
                  </button>

                  {/* Dropdown Section */}
                  {showInboxMenu && (
                    <div
                      ref={inboxMenuRef}
                      className="dropdown-menu absolute top-0 left-full ml-1 w-64 bg-white dark:bg-gray-800 border border-emerald-600 dark:border-emerald-700 rounded-lg shadow-lg z-50 p-3 space-y-2"
                    >
                      {/* Unread Row */}
                      <div
                        ref={unreadRef}
                        onClick={() =>
                          setActiveSubMenu(
                            activeSubMenu === "unreadTime" ? null : "unreadTime"
                          )
                        }
                        className="dropdown-item text-sm font-normal text-emerald-600 dark:text-emerald-400 px-2 py-1 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-700 dark:hover:text-white rounded"
                      >
                        Unread
                      </div>

                      {/* Floating Time Filter Box */}
                      {activeSubMenu === "unreadTime" && unreadRef.current && (
                        <>
                          <div
                            className="absolute z-50 bg-white dark:bg-gray-800 border border-emerald-600 dark:border-emerald-700 rounded shadow-lg p-3 w-48 space-y-2"
                            style={{
                              top: unreadRef.current?.offsetTop,
                              left:
                                (unreadRef.current.offsetLeft || 0) +
                                (unreadRef.current.offsetWidth || 0) +
                                12,
                            }}
                          >
                            <div
                              ref={dateRef}
                              onClick={() => {
                                setShowDatePicker(!showDatePicker);
                                setShowTimeRange(false);
                              }}
                              className="dropdown-item text-sm font-normal text-emerald-600 dark:text-emerald-400 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-700 rounded"
                            >
                              Date
                            </div>

                            {showDatePicker && dateRef.current && (
                              <div
                                className="absolute z-50 bg-white dark:bg-gray-800 border border-emerald-600 dark:border-emerald-700 rounded shadow-lg p-3 w-56"
                                style={{
                                  top: (dateRef.current?.offsetTop ?? 0) + 5,
                                  left:
                                    (dateRef.current?.offsetLeft ?? 0) +
                                    (dateRef.current?.offsetWidth ?? 0) +
                                    4,
                                }}
                              >
                                <input
                                  type="date"
                                  className="w-full px-2 py-2 text-sm border border-emerald-600 dark:border-emerald-700 rounded bg-white dark:bg-gray-700 cursor-pointer"
                                />
                              </div>
                            )}

                            <div
                              ref={timeRef}
                              onClick={() => {
                                setShowTimeRange(!showTimeRange);
                                setShowDatePicker(false);
                              }}
                              className="dropdown-item text-sm font-normal text-emerald-600 dark:text-emerald-400 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-700 rounded"
                            >
                              Time
                            </div>

                            {[
                              "All",
                              "Past hour",
                              "Past 2 hours",
                              "Past week",
                              "Past month",
                              "Past year",
                            ].map((label) => (
                              <div
                                key={label}
                                className="dropdown-item text-sm font-normal text-emerald-600 dark:text-emerald-400 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-700 rounded"
                              >
                                {label}
                              </div>
                            ))}
                          </div>

                          {showTimeRange && timeRef.current && (
                            <div
                              className="absolute z-50 bg-white dark:bg-gray-800 border border-emerald-600 dark:border-emerald-700 rounded shadow-lg p-3 w-62.5 min-w-62.5"
                              style={{
                                top: timeRef.current?.offsetTop || 0,
                                left:
                                  (timeRef.current?.offsetLeft || 0) +
                                  (timeRef.current?.offsetWidth || 0) +
                                  20,
                                width: "180px",
                              }}
                            >
                              <div className="flex items-center justify-between gap-1 mb-2">
                                <select className="w-25 px-1 py-1 text-xs border border-emerald-600 dark:border-emerald-700 rounded bg-white dark:bg-gray-700 dark:text-white">
                                  {[...Array(12)]
                                    .map((_, i) =>
                                      i === 0 ? "12:00" : `${i}:00`
                                    )
                                    .map((time) => (
                                      <option key={time}>{time}</option>
                                    ))}
                                </select>
                                <select className="w-[105px] px-1 py-1 text-xs border border-emerald-600 dark:border-emerald-700 rounded bg-white text-black dark:bg-gray-700 dark:text-white">
                                  {["AM", "PM"].map((meridian) => (
                                    <option key={meridian}>{meridian}</option>
                                  ))}
                                </select>
                              </div>

                              <div className="flex items-center justify-between gap-1">
                                <select className="w-25 px-1 py-1 text-xs border border-emerald-600 dark:border-emerald-700 rounded bg-white dark:bg-gray-700 dark:text-white">
                                  {[...Array(12)]
                                    .map((_, i) =>
                                      i === 0 ? "12:00" : `${i}:00`
                                    )
                                    .map((time) => (
                                      <option key={time}>{time}</option>
                                    ))}
                                </select>
                                <select className="w-[105px] px-1 py-1 text-xs border border-emerald-600 dark:border-emerald-700 rounded bg-white text-black dark:bg-gray-700 dark:text-white">
                                  {["AM", "PM"].map((meridian) => (
                                    <option key={meridian}>{meridian}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {["Assigned", "Unassigned"].map((label) => (
                        <button
                          key={label}
                          onClick={() => {
                            setActiveDropdown(label as any);
                            setShowTimeFilter(label === "Unread");
                            setActiveSubMenu(null);
                            setShowInboxMenu(false);
                          }}
                          className="dropdown-item w-full text-left text-sm font-normal text-emerald-600 dark:text-emerald-400 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-700 rounded"
                        >
                          {label}
                        </button>
                      ))}

                      <div className="border-t border-emerald-600 dark:border-emerald-700 my-2" />

                      <div className="space-y-2">
                        <div
                          ref={assignedRef}
                          onClick={() =>
                            setActiveSubMenu(
                              activeSubMenu === "assignedTo"
                                ? null
                                : "assignedTo"
                            )
                          }
                          className="dropdown-item text-sm font-normal text-emerald-600 dark:text-emerald-400 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-700 rounded"
                        >
                          Assigned to
                        </div>

                        {activeSubMenu === "assignedTo" &&
                          assignedRef.current && (
                            <div
                              className="absolute z-50"
                              style={{
                                top: assignedRef.current.offsetTop,
                                left:
                                  assignedRef.current.offsetLeft +
                                  assignedRef.current.offsetWidth +
                                  12,
                              }}
                            >
                              <input
                                type="text"
                                placeholder="demo"
                                className="w-48 px-3 py-2 text-sm border border-emerald-600 dark:border-emerald-700 rounded bg-white dark:hover:bg-emerald-700 shadow-sm"
                              />
                            </div>
                          )}

                        <div
                          ref={phoneRef}
                          onClick={() =>
                            setActiveSubMenu(
                              activeSubMenu === "phoneNumbers"
                                ? null
                                : "phoneNumbers"
                            )
                          }
                          className="dropdown-item text-sm font-normal text-emerald-600 dark:text-emerald-400 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-700 rounded"
                        >
                          Phone number
                        </div>

                        {activeSubMenu === "phoneNumbers" &&
                          phoneRef.current && (
                            <div
                              className="absolute z-50"
                              style={{
                                top: phoneRef.current.offsetTop || 0,
                                left:
                                  (phoneRef.current.offsetLeft || 0) +
                                  (phoneRef.current.offsetWidth || 0) +
                                  12,
                              }}
                            >
                              <input
                                type="text"
                                placeholder="number"
                                className="w-48 px-3 py-2 text-sm border border-emerald-600 dark:border-emerald-700 rounded bg-white dark:bg-gray-700 shadow-sm"
                              />
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Search Bar */}
              <div className="px-4 pt-3 pb-2 flex-shrink-0">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  />
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
                {loadingContacts && (
                  <p className="p-4 text-emerald-600">Loading...</p>
                )}
                {filteredContacts.map((c: any) => (
                  <ContactItem
                    key={c.id}
                    contact={c}
                    isSelected={selectedContact?.id === c.id}
                    onClick={() => handleContactSelect(c)}
                    reminders={getContactReminders(c.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Chat Panel */}
          <div
            className={`chat-area flex flex-col relative md:col-start-3 md:row-start-1 min-w-0 h-full min-h-0 ${isSidebarHiddenOnMobile ? "w-full" : ""}`}
          >
            {!selectedContact ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-emerald-600 p-6">
                <MessageSquare
                  size={60}
                  className={`${PRIMARY_TEXT} ${iconJumpAnimation}`}
                />
                <p className="mt-4 font-semibold">
                  Select a contact to start chatting
                </p>
              </div>
            ) : (
              <div className="flex flex-col h-full overflow-hidden">
                {/* Chat Header */}
                <div
                  className="chat-header h-16 px-4 flex justify-between items-center"
                >
                  <div className="flex items-center gap-3">
                    {/* Back button (mobile) */}
                    <button
                      onClick={() => {
                        setSelectedContact(null);
                        setIsMobileSidebarOpen(true);
                      }}
                      className={iconJumpAnimation + " md:hidden"}
                    >
                      <ArrowLeft className={iconJumpAnimation} />
                    </button>

                    {/* DP */}
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/60 text-black dark:text-white font-bold">
                      {selectedContact?.initials}
                    </div>

                    {/* Contact info */}
                    <div className="flex flex-col leading-tight">
                      <span className="font-semibold text-sm">
                        {selectedContact?.name}
                      </span>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400">
                        {selectedContact?.phone ? `+${selectedContact.phone}` : "Connected"}
                      </span>
                    </div>
                  </div>

                  {/* Action icons */}
                  <div className="flex items-center gap-4 text-slate-700 dark:text-slate-200">
                    <div className="relative group">
                      <Phone
                        size={18}
                        className={`${iconJumpAnimation} hover:text-emerald-600 transition-colors duration-200`}
                      />
                      <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-emerald-100 text-emerald-800 text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 whitespace-nowrap shadow-lg border border-emerald-300 font-semibold transform group-hover:translate-y-[2px]">
                        Audio call
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-emerald-300"></div>
                      </span>
                    </div>

                    <div className="relative group">
                      <Video
                        size={18}
                        className={`${iconJumpAnimation} hover:text-emerald-600 transition-colors duration-200`}
                      />
                      <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-emerald-100 text-emerald-800 text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 whitespace-nowrap shadow-lg border border-emerald-300 font-semibold transform group-hover:translate-y-[2px]">
                        Video call
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-emerald-300"></div>
                      </span>
                    </div>

                    <div className="relative group">
                      <button
                        onClick={() => setShowFAQFlow(!showFAQFlow)}
                        className={`${iconJumpAnimation} hover:text-emerald-600 transition-colors duration-200`}
                      >
                        <MessageSquare size={18} />
                      </button>
                      <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-emerald-900 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap">
                        FAQ Bot
                      </span>
                    </div>

                    <div className="relative group">
                      <MoreVertical
                        size={18}
                        className={`${iconJumpAnimation} hover:text-emerald-600 transition-colors duration-200`}
                      />
                      <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-emerald-100 text-emerald-800 text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 whitespace-nowrap shadow-lg border border-emerald-300 font-semibold transform group-hover:translate-y-[2px]">
                        Options
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-emerald-300"></div>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="chat-scroll flex-1 p-4 overflow-y-auto space-y-3 min-h-0">
                  {messages.map((msg: Message) => (
                    <div
                      key={msg.id}
                      className={`flex ${isMyMessage(msg) ? "justify-end" : "justify-start"
                        }`}
                    >
                      <div
                        className={`message-bubble ${isMyMessage(msg) ? "message-sent" : "message-received"
                          }`}
                      >
                        {msg.isTemplate && msg.templateComponents ? (
                          <div className="flex flex-col gap-1">
                            <TemplateMessage components={msg.templateComponents} />
                            <div className="message-meta text-[10px] text-right flex items-center justify-end gap-1.5 opacity-60">
                              <span className="font-medium">
                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              <MessageStatus
                                status={msg.status}
                                direction={msg.direction}
                                error={msg.error}
                                readAt={(msg as any).readAt}
                                deliveredAt={(msg as any).deliveredAt}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-0.5">
                            {/* Media Preview */}
                            {msg.mediaUrl && (
                              <div className="mb-2">
                                {msg.messageType === 'image' || msg.mediaType?.startsWith('image/') ? (
                                  <img
                                    src={msg.mediaUrl}
                                    alt="Sent image"
                                    className="max-w-[280px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => window.open(msg.mediaUrl!, '_blank')}
                                  />
                                ) : msg.messageType === 'video' || msg.mediaType?.startsWith('video/') ? (
                                  <video
                                    src={msg.mediaUrl}
                                    controls
                                    className="max-w-[280px] rounded-lg"
                                  />
                                ) : msg.messageType === 'audio' || msg.mediaType?.startsWith('audio/') ? (
                                  <audio src={msg.mediaUrl} controls className="max-w-[280px]" />
                                ) : (
                                  <a
                                    href={msg.mediaUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-3 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                  >
                                    <FileText className="w-8 h-8 text-orange-500" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        Document
                                      </p>
                                      <p className="text-xs text-emerald-600">Click to download</p>
                                    </div>
                                  </a>
                                )}
                              </div>
                            )}
                            {/* Text/Caption */}
                            {msg.text && !msg.text.startsWith('[') && (
                              <div className="message-text pr-2 leading-relaxed">
                                {msg.text}
                              </div>
                            )}
                            <div className="message-meta text-[10px] text-right flex items-center justify-end gap-1.5 opacity-60">
                              <span className="font-medium">
                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              <MessageStatus
                                status={msg.status}
                                direction={msg.direction}
                                error={msg.error}
                                readAt={(msg as any).readAt}
                                deliveredAt={(msg as any).deliveredAt}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  ))}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input Section with File Attachment */}
                <div className="chat-input-wrap relative w-full px-4 py-3 flex-shrink-0">
                  {/* Previews Container - Fixed Height */}
                  <div className="mb-3 min-h-0">
                    {/* File Preview */}
                    {selectedFile && (
                      <div className="mb-2 flex items-center gap-2 bg-emerald-50 dark:bg-gray-700 rounded-lg p-3 border border-emerald-200 dark:border-emerald-600">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            📎 {selectedFile.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {(selectedFile.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedFile(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {/* Gallery Media Preview */}
                    {selectedGalleryMedia && (
                      <div className="mb-2 flex items-center gap-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-600">
                        {selectedGalleryMedia.type?.startsWith('image/') ? (
                          <img
                            src={selectedGalleryMedia.url}
                            alt={selectedGalleryMedia.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-800 rounded flex items-center justify-center">
                            <FileText className="w-6 h-6 text-purple-500" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {selectedGalleryMedia.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            From Gallery • {selectedGalleryMedia.size}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedGalleryMedia(null)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {/* Audio Recording Preview */}
                    {audioBlob && (
                      <div className="mb-2 flex items-center gap-2 bg-emerald-50 dark:bg-gray-700 rounded-lg p-3 border border-emerald-200 dark:border-emerald-600">
                        <div className="flex-1 flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                            <Mic size={16} className="text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              Voice Message
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Duration: {formatTime(recordingTime)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setAudioBlob(null);
                            setRecordingTime(0);
                          }}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {/* Recording Indicator */}
                    {isRecording && (
                      <div className="mb-2 flex items-center justify-between gap-2 bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-600">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium text-red-600 dark:text-red-400">
                            Recording... {formatTime(recordingTime)}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={cancelRecording}
                            className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={stopRecording}
                            className="px-3 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors"
                          >
                            Stop
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input Bar - Fixed Position */}
                  <div className="chat-input flex items-center gap-2 px-4 py-2.5">
                    {/* Hidden File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                      onChange={handleFileSelect}
                    />

                    {/* Attachment Button & Menu */}
                    <div className="chat-icon-btn">
                      <Paperclip
                        size={20}
                        onClick={() => setShowAttachMenu(!showAttachMenu)}
                        className="attach-button text-slate-500 dark:text-slate-300 hover:text-emerald-500 cursor-pointer"
                      />

                      {showAttachMenu && (
                        <div className="attach-menu absolute bottom-12 left-0 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-emerald-200 dark:border-emerald-600 p-2 w-48 z-50 space-y-1">
                          <button
                            onClick={() => {
                              fileInputRef.current?.click();
                              setShowAttachMenu(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-emerald-100 dark:hover:bg-gray-700 rounded-md text-sm text-gray-700 dark:text-gray-200 transition-colors"
                          >
                            <Paperclip size={18} className="text-emerald-500" />
                            <span>Upload File</span>
                          </button>

                          <button
                            onClick={() => {
                              setShowAttachMenu(false);
                              setShowGalleryPicker(true);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-emerald-100 dark:hover:bg-gray-700 rounded-md text-sm text-gray-700 dark:text-gray-200 transition-colors"
                          >
                            <Image size={18} className="text-purple-500" />
                            <span>From Gallery</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Template Button */}
                    <div className="chat-icon-btn">
                      <button
                        type="button"
                        onClick={() => setShowTemplateSelector(true)}
                        className="text-slate-500 dark:text-slate-300 hover:text-emerald-500 transition-colors"
                      >
                        <FileText size={20} />
                      </button>
                    </div>

                    {/* Text Input */}
                    <input
                      type="text"
                      {...register("message")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Type a message"
                      className="message-input flex-1 bg-transparent outline-none text-sm"
                      disabled={isRecording}
                    />

                    {/* Send Button / Mic */}
                    {messageValue.trim() || selectedFile || audioBlob || selectedGalleryMedia ? (
                      <button
                        onClick={handleSend}
                        disabled={sendMessageMutation.isPending || isSendingMedia}
                        className="btn-primary w-9 h-9 flex items-center justify-center rounded-full disabled:opacity-50 relative"
                      >
                        {sendMessageMutation.isPending || isSendingMedia ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send size={18} className="text-white" />
                        )}
                      </button>
                    ) : (
                      <div className="relative group">
                        <button
                          onClick={isRecording ? stopRecording : startRecording}
                          className={`chat-icon-btn chat-mic-btn flex items-center justify-center ${isRecording
                            ? "chat-mic-btn-recording"
                            : ""
                            }`}
                        >
                          <Mic size={18} />
                        </button>
                        <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-emerald-900 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap">
                          {isRecording ? "Stop Recording" : "Voice Message"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* FAQ Flow Component */}
      {showFAQFlow && selectedContact && (
        <FAQFlow
          contactId={selectedContact.id}
          contactName={selectedContact.name}
          onClose={() => setShowFAQFlow(false)}
          botId={selectedBotForFAQ}
        />
      )}

      {/* Template Selector Modal */}
      {showTemplateSelector && selectedContact && (
        <TemplateSelectorModal
          isOpen={showTemplateSelector}
          onClose={() => setShowTemplateSelector(false)}
          contactPhone={selectedContact.phone || ""}
          contactName={selectedContact.name}
          onSend={async (templateId, variables) => {
            try {
              await axiosInstance.post("/api/whatsapp/send-template", {
                contactId: selectedContact.id,
                templateId,
                variables,
              });
              queryClient.invalidateQueries({
                queryKey: ["messages", selectedContact.id],
              });
              toast.success("Template sent successfully!");
            } catch (error) {
              console.error("Error sending template:", error);
              toast.error("Failed to send template");
            }
          }}
        />
      )}

      {/* Gallery Picker Modal */}
      <GalleryPickerModal
        isOpen={showGalleryPicker}
        onClose={() => setShowGalleryPicker(false)}
        onSelect={(media) => {
          setSelectedGalleryMedia(media);
          setShowGalleryPicker(false);
        }}
      />
    </div>
  );
}
