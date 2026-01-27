"use client";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Settings as SettingsIcon } from "lucide-react"; // optional, only if you want a settings icon
import { useTheme } from "next-themes";

import {
  ChevronDown,
  ChevronUp,
  Home,
  User,
  BarChart2,
  Settings,
  Inbox,
  Blocks,
  Cog,
  Image as ImageIcon,
  BotMessageSquare,
  Bot,
  ArrowDownUp,
  Cable,
  BookOpenText,
  FolderCode,
  Zap,
  Moon,
  Sun,
  Bell,
} from "lucide-react";
import ProfileCard from "@/components/ProfileCard";
import router from "next/router";

interface UserData {
  id?: number;
  name: string;
  email: string;
  image?: string;
}

interface SidebarItemProps {
  expanded: boolean;
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  children?: React.ReactNode;
}

function SidebarItem({ expanded, icon, label, href, onClick, className, children }: SidebarItemProps) {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = href && pathname === href;
  const baseClasses =
    "relative flex items-center gap-3 p-3 my-1 font-medium rounded-xl cursor-pointer transition-all duration-300 group sidebar-item";
  const activeClasses =
    "bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 shadow-sm";
  const inactiveClasses =
    "text-gray-700 dark:text-gray-200";

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) onClick(e);
    else if (href) router.push(href);
  };

  return (
    <li
      onClick={handleClick}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses
        } ${className || ""}`}
    >
      {children ? (
        children
      ) : (
        <>
          {/* Icon */}
          <div
            className={`transition-colors duration-300 ${isActive
                ? "text-green-600 dark:text-green-300"
                : "text-gray-500 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-300"
              }`}
          >
            {icon}
          </div>

          {/* Label */}
          <span
            className={`overflow-hidden whitespace-nowrap ${expanded ? "block" : "hidden"
              }`}
          >
            {label}
          </span>

          {/* Tooltip when collapsed */}
          {!expanded && (
            <div
              className={`absolute left-full rounded-md px-2 py-1 ml-6
                bg-green-700 dark:bg-green-800 text-white text-sm
                invisible opacity-0 translate-x-3 transition-all duration-300
                group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 z-50`}
            >
              {label}
            </div>
          )}
        </>
      )}
    </li>
  );
}

export function Sidebar() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [expanded, setExpanded] = useState(true);
  const [manageOpen, setManageOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);

  const pathname = usePathname();

  useEffect(() => {
    // Check if any sub-item of "Manage" is active
    const manageHrefs = [
      "/manage/templates",
      "/manage/whatsapp-flows",
      "/manage/tags",
      "/manage/columns",
      "/manage/opts-management",
      "/manage/webhooks",
    ];
    if (manageHrefs.some((href) => pathname === href)) {
      setManageOpen(true);
    }
  }, [pathname]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };
    fetchUser();
  }, []);

  // ⬇️ No darkMode useEffect here anymore





  // ✅ Fetch user info on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };
    fetchUser();
  }, []);


  return (
    <>
      <aside
        className={`${expanded ? "w-64" : "w-20"
          } sticky top-0 h-screen transition-all duration-300 ease-in-out`}
      >
        <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 h-full flex flex-col border-r border-gray-100 dark:border-gray-800 shadow-lg">
          {/* ✅ Logo Section (Replaced Text with Image) */}
          <div
            className="p-4 flex items-center justify-start border-b border-gray-100 dark:border-gray-800 h-20 cursor-pointer hover:bg-green-50 dark:hover:bg-gray-800 transition duration-150"
            onClick={() => setExpanded(!expanded)}
          >
            {/* Expanded View Logo */}
            <div
              className={`flex items-center transition-opacity duration-300 ${expanded ? "opacity-100" : "opacity-0 hidden"
                }`}
            >
              <Image
                src={isDark ? "/logo-dark.png" : "/logo-light.png"}
                alt="SOFT7 Logo"
                width={100}
                height={100}
                className="object-contain transition-all"
              />
            </div>

            {/* Collapsed View Logo */}
            <div
              className={`p-1 flex justify-center ${expanded ? "hidden" : "block"
                }`}
            >
              <Image
                src={isDark ? "/logo-dark.png" : "/logo-light.png"}
                alt="SOFT7 Logo Small"
                width={40}
                height={40}
                className="object-contain transition-all"
              />
            </div>
          </div>
          {/* Navigation Section */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
            <ul>
              <SidebarItem
                expanded={expanded}
                icon={<Home size={20} />}
                label="Dashboard"
                href="/dashboard"
              />
              <SidebarItem
                expanded={expanded}
                icon={<Inbox size={20} />}
                label="Inbox"
                href="/inbox"
              />
              <SidebarItem
                expanded={expanded}
                icon={<User size={20} />}
                label="Contact"
                href="/contacts"
              />
              <SidebarItem
                expanded={expanded}
                icon={<BarChart2 size={20} />}
                label="Campaigns"
                href="/campaigns"
              />

              <SidebarItem
                expanded={expanded}
                icon={<Blocks size={20} />}
                label="Integrations"
                href="/integrations"
              />

              {/* Manage Dropdown */}
              <li
                className={`p-3 my-1 font-medium rounded-xl cursor-pointer transition-all duration-300 group ${manageOpen
                    ? "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-white"  // DARK MODE OPEN STYLE
                    : "text-gray-600 dark:text-gray-200"
                  }`}
              >


                <div
                  className="flex items-center justify-between"
                  onClick={() => setManageOpen(!manageOpen)}
                >
                  <div className="flex items-center gap-3">
                    <Cog
                      size={20}
                      className="text-green-600 dark:text-green-300"
                    />
                    {expanded && (
                      <span className="text-gray-700 dark:text-gray-200">
                        Manage
                      </span>
                    )}
                    {!expanded && (
                      <div className="absolute left-full rounded-md px-2 py-1 ml-6 bg-green-700 text-white text-sm invisible opacity-0 translate-x-3 transition-all duration-300 group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 z-50">
                        Manage
                      </div>
                    )}
                  </div>
                  {expanded && (
                    <div className="text-gray-500 dark:text-gray-400">
                      {manageOpen ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </div>
                  )}
                </div>

                <div
                  className={`overflow-hidden transition-all duration-300 ${manageOpen && expanded ? "max-h-96 mt-2" : "max-h-0"
                    }`}
                >
                  <ul className="ml-5 mt-1 space-y-1 text-sm text-gray-600 dark:text-gray-300 border-l-2 border-green-100 dark:border-green-900">
                    <LinkItem
                      href="/manage/templates"
                      label="WhatsApp Templates"
                    />
                    <LinkItem
                      href="/manage/whatsapp-flows"
                      label="WhatsApp Forms"
                    />
                    <LinkItem href="/manage/tags" label="Tags" />
                    <LinkItem href="/manage/columns" label="Columns" />
                    <LinkItem
                      href="/manage/opts-management"
                      label="Opts Management"
                    />
                    <LinkItem href="/manage/webhooks" label="Webhook Events" />
                  </ul>
                </div>
              </li>

              {/* Other Items */}
              <SidebarItem
                expanded={expanded}
                icon={<ImageIcon size={20} />}
                label="Gallery"
                href="/gallery"
              />
              <SidebarItem
                expanded={expanded}
                icon={<BotMessageSquare size={20} />}
                label="FAQ Bot"
                href="/chatbot-faq"
              />
              <SidebarItem
                expanded={expanded}
                icon={<Bot size={20} />}
                label="Chatbot"
                href="/chatbot"
              />

              <SidebarItem
                expanded={expanded}
                icon={<Bot size={20} />}
                label="AI Assistant"
                href="/ai-assistant"
              />
              <SidebarItem
                expanded={expanded}
                icon={<ArrowDownUp size={20} />}
                label="Flows"
                href="/flows"
              />

              <SidebarItem
                expanded={expanded}
                icon={<BookOpenText size={20} />}
                label="Knowledge Base"
                href="/knowledge-base"
              />
              <SidebarItem
                expanded={expanded}
                icon={<FolderCode size={20} />}
                label="Developers"
                href="/developers"
              />
            </ul>
          </nav>

          {/* Bottom Section */}
          <div className="p-3 border-t border-gray-100 dark:border-gray-800 mt-auto space-y-2">
            <ul>
              <SidebarItem
                expanded={expanded}
                icon={<Bell size={20} />}
                label="Reminder"
                href="/reminder"
              />
              <SidebarItem
                expanded={expanded}
                icon={<SettingsIcon size={20} />}
                label="Settings"
                onClick={() => (window.location.href = "/settings")}
                className="relative flex items-center gap-3 p-3 my-1 font-medium rounded-xl cursor-pointer transition-all duration-300 group
           text-gray-700 dark:text-gray-200
           hover:bg-green-50 hover:text-green-700
           dark:hover:!bg-black dark:hover:text-white"



              >
                {/* Show Icon and Label when expanded */}
                {expanded && (
                  <>
                    <SettingsIcon
                      size={20}
                      className="text-gray-500 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-300 transition-colors"
                    />
                    <span className="overflow-hidden whitespace-nowrap">Settings</span>
                  </>
                )}

                {/* Show Avatar/icon when collapsed */}
                {!expanded && (
                  <>
                    <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 border border-gray-300 dark:border-gray-600">
                      {user?.image ? (
                        <img
                          src={user.image}
                          alt="User Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[var(--theme-color)]/10">
                          <SettingsIcon size={12} className="text-[var(--theme-color)]" />
                        </div>
                      )}
                    </div>

                    {/* Tooltip when collapsed */}
                    <div className="absolute left-full rounded-md px-2 py-1 ml-6 bg-green-700 dark:bg-green-800 text-white text-sm invisible opacity-0 translate-x-3 transition-all duration-300 group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 z-50">
                      Settings
                    </div>
                  </>
                )}
              </SidebarItem>

            </ul>
          </div>
        </div>

        <style jsx global>{`
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #d1d5db;
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: #9ca3af;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background-color: transparent;
  }

  /* 🟣 Sidebar hover behaviour */
  .sidebar-item {
    transition: background-color 150ms ease, color 150ms ease;
  }

  /* 🌞 Light mode hover (green) */
  .sidebar-item:hover {
    background-color: #ecfdf5; /* like bg-green-50 */
    color: #047857;           /* like text-green-700 */
  }

  /* 🌙 Dark mode hover: PURE BLACK + WHITE */
  html.dark .sidebar-item:hover,
  html.dark li .sidebar-item:hover,
  html.dark a.sidebar-item:hover {
    background-color: #000000 !important;
    color: #ffffff !important;
  }
`}</style>


      </aside>

      {showProfile && <ProfileCard onClose={() => setShowProfile(false)} />}
    </>
  );
}

interface LinkItemProps {
  href: string;
  label: string;
}

function LinkItem({ href, label }: LinkItemProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isActive = pathname === href;

  return (
    <li className="relative group/item">
      <div
        onClick={() => router.push(href)}
        className={`block px-4 py-2 rounded-lg transition-all duration-300 cursor-pointer
          ${isActive
            ? "bg-green-100 dark:bg-green-800/50 text-green-700 dark:text-green-300 font-semibold"
            : "text-gray-600 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-gray-800 hover:text-green-600 dark:hover:text-green-200"
          }
        `}
      >
        <div className="flex items-center gap-2">
          {isActive && (
            <div className="absolute left-[-10px] w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          )}
          {label}
        </div>
      </div>
    </li>
  );
}
