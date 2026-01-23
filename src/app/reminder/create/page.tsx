"use client";

import { useState, useEffect, useRef } from "react";
import { Users, Tag, FolderPlus, User, Phone, Send, List, ListOrdered, AlignJustify, Type, X } from "lucide-react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { EmojiClickData } from "emoji-picker-react";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

const MENU = [
  { id: "all", label: "All Contacts", icon: Users },
  { id: "group", label: "Group", icon: Users },
  { id: "create", label: "Create Group", icon: FolderPlus },
  { id: "tags", label: "Tags", icon: Tag },
  { id: "one", label: "One", icon: User },
];

interface Contact {
  id: number;
  name: string;
  number: string;
  email?: string;
}

interface Group {
  id: string;
  name: string;
  members: number;
}

interface TagType {
  id: number;
  name: string;
  count: number;
}

export default function CreateReminderStep1() {
  const router = useRouter();

  const [activeMenu, setActiveMenu] = useState("all");
  const [selected, setSelected] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  
  // Data from API
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [loading, setLoading] = useState(true);

  // Toolbar States
  const [showEmoji, setShowEmoji] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // FETCH CONTACTS, GROUPS, AND TAGS FROM API
  useEffect(() => {
    const fetchContactData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/contacts?forReminder=true");
        
        if (!response.ok) {
          if (response.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Failed to fetch contacts");
        }

        const data = await response.json();
        
        setAllContacts(data.contacts || []);
        setGroups(data.groups || []);
        setTags(data.tags || []);
      } catch (error) {
        console.error("Error fetching contact data:", error);
        alert("Failed to load contacts");
      } finally {
        setLoading(false);
      }
    };
    
    fetchContactData();
  }, [router]);

  // Load Draft From LocalStorage
  useEffect(() => {
    const raw = localStorage.getItem("draftReminder");
    if (raw) {
      try {
        const d = JSON.parse(raw);
        if (d.recipients) setSelected(d.recipients);
        if (d.message) setMessage(d.message);
      } catch {
        // ignore parse error
      }
    }
  }, []);

  // Save Draft to LocalStorage
  useEffect(() => {
    const draft = { recipients: selected, message };
    localStorage.setItem("draftReminder", JSON.stringify(draft));
  }, [selected, message]);

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

  const applyList = (type: "bullet" | "number" | "spacing") => {
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
        } else if (type === "spacing") {
          return line + "\n";
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

  const onEmojiClick = (emojiData: EmojiClickData) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const emoji = emojiData.emoji;

    const newMessage = message.slice(0, start) + emoji + message.slice(end);
    setMessage(newMessage);
    setShowEmoji(false);
  };

  const toggleSelect = (item: any) => {
    setSelected((prev) => {
      if (prev.find((x) => x.id === item.id && x.type === item.type)) {
        return prev.filter((x) => !(x.id === item.id && x.type === item.type));
      }
      return [...prev, item];
    });
  };

  const removeSelected = (item: any) => {
    setSelected((prev) =>
      prev.filter((x) => !(x.id === item.id && x.type === item.type))
    );
  };

  const handleNext = () => {
    if (selected.length === 0) {
      alert("Select at least one recipient.");
      return;
    }
    if (!message.trim()) {
      alert("Write a reminder message.");
      return;
    }
    router.push("/reminder/create/next");
  };

  // Search Filtering
  const filteredContacts = allContacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.number.includes(search)
  );
  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredTags = tags.filter((t) =>
    (typeof t === 'string' ? t : t.name).toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen reminder-create-container flex items-center justify-center" style={{ backgroundColor: '#d1f3de' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen reminder-create-container" style={{ backgroundColor: '#d1f3de' }}>
      <div className="max-w-[1600px] mx-auto p-6">
        {/* HEADER */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm mb-3" style={{ color: '#000000' }}></div>
          <h1 className="text-3xl font-bold mb-2 force-dark-green">Create Reminder</h1>
          <p className="text-lg force-dark-green">
            Compose your message and select recipients to send reminders
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT SIDEBAR */}
          <div className="lg:col-span-1 rounded-xl shadow-xl border border-gray-100 overflow-hidden h-fit" style={{ backgroundColor: '#e8f8f0' }}>
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-3">
              <h2 className="text-base font-semibold force-dark-green">
                Select Recipients
              </h2>
              <p className="text-xs mt-0.5 force-dark-green">
                Choose contacts, groups, or tags
              </p>
            </div>

            <div className="p-3">
              {/* Menu */}
              <div className="space-y-1.5 mb-3">
                {MENU.map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setActiveMenu(m.id)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all duration-200 ${
                        activeMenu === m.id
                          ? "bg-emerald-600 text-white shadow-md"
                          : "hover:bg-emerald-500"
                      }`}
                      style={{ color: activeMenu === m.id ? '#ffffff' : '#000000' }}
                    >
                      <Icon size={16} />
                      <span className="font-medium text-sm">{m.label}</span>
                    </button>
                  );
                })}
              </div>
              {/* Search */}
              <div className="relative">
                <input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all text-sm text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* List Section */}
            <div className="px-3 pb-3 max-h-[320px] overflow-y-auto">
              {/* Contacts */}
              {activeMenu === "all" &&
                (filteredContacts.length > 0 ? (
                  filteredContacts.map((c) => (
                    <div
                      key={c.id}
                      onClick={() =>
                        toggleSelect({
                          id: c.id,
                          label: c.name,
                          type: "contact",
                        })
                      }
                      className={`p-2 my-1 rounded-lg cursor-pointer transition-all duration-200 flex justify-between items-center ${
                        selected.find(
                          (x) => x.id === c.id && x.type === "contact"
                        )
                          ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-400 shadow"
                          : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-sm text-gray-900 dark:text-white">
                          {c.name}
                        </div>
                        <div className="text-xs flex items-center gap-1 mt-1 text-gray-700 dark:text-white">
                          <Phone size={10} />
                          {c.number}
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selected.find(
                            (x) => x.id === c.id && x.type === "contact"
                          )
                            ? "bg-emerald-500 border-emerald-500"
                            : "border-gray-300"
                        }`}
                      >
                        {selected.find(
                          (x) => x.id === c.id && x.type === "contact"
                        ) && (
                          <svg
                            className="w-3.5 h-3.5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No contacts found
                  </div>
                ))}

              {/* Groups */}
              {activeMenu === "group" &&
                (filteredGroups.length > 0 ? (
                  filteredGroups.map((g) => (
                    <div
                      key={g.id}
                      onClick={() =>
                        toggleSelect({ id: g.id, label: g.name, type: "group" })
                      }
                      className={`p-2 my-1 rounded-lg cursor-pointer transition-all duration-200 flex justify-between items-center ${
                        selected.find((x) => x.id === g.id && x.type === "group")
                          ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-400 shadow"
                          : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-sm text-gray-900 dark:text-white">
                          {g.name}
                        </div>
                        <div className="text-xs mt-1 text-gray-700 dark:text-white">
                          {g.members} members
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selected.find(
                            (x) => x.id === g.id && x.type === "group"
                          )
                            ? "bg-emerald-500 border-emerald-500"
                            : "border-gray-300"
                        }`}
                      >
                        {selected.find(
                          (x) => x.id === g.id && x.type === "group"
                        ) && (
                          <svg
                            className="w-3.5 h-3.5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No groups found
                  </div>
                ))}

              {/* Tags */}
              {activeMenu === "tags" &&
                filteredTags.map((t, i) => {
                  const tagName = typeof t === 'string' ? t : t.name;
                  const tagId = typeof t === 'string' ? `tag-${i}` : t.id;
                  return (
                    <div
                      key={tagId}
                      onClick={() =>
                        toggleSelect({
                          id: tagId,
                          label: tagName,
                          type: "tag",
                        })
                      }
                      className={`p-2 my-1 rounded-lg cursor-pointer transition-all duration-200 flex justify-between items-center ${
                        selected.find(
                          (x) => x.label === tagName && x.type === "tag"
                        )
                          ? "bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-400 shadow"
                          : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                      }`}
                    >
                      <div className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                        <Tag size={13} className="text-indigo-500" />
                        {tagName}
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selected.find(
                            (x) => x.label === tagName && x.type === "tag"
                          )
                            ? "bg-indigo-500 border-indigo-500"
                            : "border-gray-300"
                        }`}
                      >
                        {selected.find(
                          (x) => x.label === tagName && x.type === "tag"
                        ) && (
                          <svg
                            className="w-3.5 h-3.5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                  );
                })}

              {/* ONE-to-ONE */}
              {activeMenu === "one" &&
                (allContacts.length > 0 ? (
                  allContacts.map((c) => (
                    <button
                      key={c.id}
                      onClick={() =>
                        toggleSelect({ id: c.id, label: c.name, type: "one" })
                      }
                      className={`w-full text-left p-2 my-1 rounded-lg transition-all duration-200 flex justify-between items-center ${
                        selected.find((x) => x.id === c.id && x.type === "one")
                          ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-400 shadow"
                          : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-sm text-gray-900 dark:text-white">
                          {c.name}
                        </div>
                        <div className="text-xs flex items-center gap-1 mt-1 text-gray-700 dark:text-white">
                          <Phone size={10} />
                          {c.number}
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selected.find((x) => x.id === c.id && x.type === "one")
                            ? "bg-emerald-500 border-emerald-500"
                            : "border-gray-300"
                        }`}
                      >
                        {selected.find(
                          (x) => x.id === c.id && x.type === "one"
                        ) && (
                          <svg
                            className="w-3.5 h-3.5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No contacts available
                  </div>
                ))}
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="lg:col-span-2 space-y-6">
            {/* Message Composer Card */}
            <div className="rounded-2xl shadow-xl border border-gray-100 overflow-hidden" style={{ backgroundColor: '#e8f8f0' }}>
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4">
                <h2 className="text-base font-semibold force-dark-green">Compose Message</h2>
                <p className="text-xs mt-0.5 force-dark-green">
                  Write your reminder message with formatting
                </p>
              </div>

              <div className="p-5">
                <div className="mb-3">
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full rounded-xl border-2 border-gray-200 p-4 h-56 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all resize-none text-sm text-gray-900 dark:text-white"
                    placeholder="Type your reminder message here... ✨"
                  />
                  
                  <div className="relative mt-3 flex justify-between items-center">
                    <div>
                      <button
                        onClick={() => setShowToolbar(!showToolbar)}
                        className={`p-2.5 rounded-lg shadow-md border-2 transition-all duration-300 font-medium ${
                          showToolbar
                            ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-500 scale-105"
                            : "text-gray-700 border-gray-200 hover:border-emerald-300 hover:shadow-lg"
                        }`}
                        style={!showToolbar ? { backgroundColor: '#e8f8f0' } : {}}
                        title="Formatting Options"
                      >
                        <Type size={18} className="force-black" />
                      </button>
                      
                      {showToolbar && (
                        <div className="absolute bottom-0 left-14 z-50">
                          <div className="flex items-center gap-1 rounded-lg shadow-xl border-2 border-emerald-200 p-1.5" style={{ backgroundColor: '#e8f8f0' }}>
                            <button
                              onClick={() => applyStyle("bold")}
                              className="p-2.5 hover:bg-emerald-400 active:bg-emerald-100 rounded-md transition-all duration-200"
                              title="Bold"
                            >
                              <b className="text-sm" style={{ color: '#000000' }}>B</b>
                            </button>

                            <button
                              onClick={() => applyStyle("italic")}
                              className="p-2.5 hover:bg-emerald-400 active:bg-emerald-100 rounded-md transition-all duration-200"
                              title="Italic"
                            >
                              <span className="text-sm italic font-serif" style={{ color: '#000000' }}>I</span>
                            </button>

                            <button
                              onClick={() => setShowEmoji(!showEmoji)}
                              className={`p-2.5 hover:bg-emerald-400 active:bg-emerald-100 rounded-md transition-all duration-200 text-lg leading-none ${
                                showEmoji ? "bg-emerald-50" : ""
                              }`}
                              title="Insert Emoji"
                            >
                              😊
                            </button>

                            <div className="w-px h-6 bg-gray-200 mx-1" />

                            <button
                              onClick={() => applyList("bullet")}
                              className="p-2.5 hover:bg-emerald-400 active:bg-emerald-100 rounded-md transition-all duration-200"
                              title="Bullet List"
                            >
                              <List size={16} style={{ color: '#000000' }} />
                            </button>

                            <button
                              onClick={() => applyList("number")}
                              className="p-2.5 hover:bg-emerald-400 active:bg-emerald-100 rounded-md transition-all duration-200"
                              title="Numbered List"
                            >
                              <ListOrdered size={16} style={{ color: '#000000' }} />
                            </button>

                            <button
                              onClick={() => applyList("spacing")}
                              className="p-2.5 hover:bg-emerald-400 active:bg-emerald-100 rounded-md transition-all duration-200"
                              title="Line Spacing"
                            >
                              <AlignJustify size={16} style={{ color: '#000000' }} />
                            </button>
                          </div>
                        </div>
                      )}

                      {showEmoji && (
                        <div className="absolute z-50 bottom-0 left-80 shadow-2xl rounded-lg overflow-hidden">
                          <EmojiPicker onEmojiClick={onEmojiClick} width={320} height={360} />
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          localStorage.removeItem("draftReminder");
                          router.push("/reminder");
                        }}
                        className="px-5 py-2.5 rounded-lg border-2 border-red-500 bg-red-500 hover:bg-red-600 hover:border-red-600 transition-all font-medium text-sm text-white"
                      >
                        Cancel
                      </button>

                      <button
                        onClick={handleNext}
                        className="inline-flex items-center gap-1.5 bg-emerald-600 text-white px-5 py-2.5 rounded-lg hover:shadow-lg transition-all font-medium text-sm hover:scale-105"
                      >
                        Next <Send size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Recipients Card */}
            <div className="rounded-xl shadow-xl border border-gray-100 p-2 hover:shadow-2xl transition-shadow duration-300" style={{ backgroundColor: '#e8f8f0' }}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-base font-semibold force-black">Selected Recipients</h3>
                  <p className="text-xs mt-0.5 force-black">
                    {selected.length} {selected.length === 1 ? "recipient" : "recipients"} selected
                  </p>
                </div>
                {selected.length > 0 && (
                  <button
                    onClick={() => setSelected([])}
                    className="text-xs text-emerald-600 hover:text-emerald-800 font-medium transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>
              {selected.length === 0 ? (
                <div className="text-center py-4 force-black">
                  <Users size={28} className="mx-auto mb-1 force-black opacity-60" />
                  <p className="text-sm">No recipients selected</p>
                  <p className="text-xs mt-0.5">Choose contacts from the left panel</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selected.map((s) => (
                    <div
                      key={String(s.id)}
                      className="group relative px-2 py-1 pr-7 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-700 font-medium text-xs transition-all hover:shadow"
                    >
                      {s.label}
                      <button
                        onClick={() => removeSelected(s)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded-full bg-emerald-200 text-emerald-700 opacity-0 group-hover:opacity-100 hover:bg-emerald-300 transition-all"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div> 
    </div>
  );