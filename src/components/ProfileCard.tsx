"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  User,
  LogOut,
  Moon,
  Sun,
  Monitor,
  Palette,
  Upload,
} from "lucide-react";

interface UserData {
  id?: number;
  name: string;
  email: string;
  image?: string;
}

export default function ProfileCard({ onClose }: { onClose: () => void }) {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [color, setColor] = useState<string>("default");
  const [user, setUser] = useState<UserData | null>(null);
  const router = useRouter();

  // 🧠 Fetch logged-in user info
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          console.log(data);
          setUser(data);
        } else {
          console.error("Failed to fetch user info");
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };
    fetchUser();
  }, []);

  // 🎨 Apply color palette globally
  useEffect(() => {
    if (color && color !== "default") {
      document.documentElement.setAttribute("data-theme", color);
      localStorage.setItem("themeColor", color);
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.removeItem("themeColor");
    }
  }, [color]);

  // 💾 Load saved color
  useEffect(() => {
    const saved = localStorage.getItem("themeColor");
    if (saved) setColor(saved);
  }, []);

  // 🌙 Apply dark/light/system theme
  useEffect(() => {
    const applyTheme = (mode: "light" | "dark") => {
      document.documentElement.classList.toggle("dark", mode === "dark");
    };

    const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

    const updateTheme = () => {
      if (theme === "system") {
        applyTheme(systemDark.matches ? "dark" : "light");
      } else {
        applyTheme(theme);
      }
    };

    updateTheme();

    const listener = (e: MediaQueryListEvent) => {
      if (theme === "system") applyTheme(e.matches ? "dark" : "light");
    };
    systemDark.addEventListener("change", listener);
    return () => systemDark.removeEventListener("change", listener);
  }, [theme]);

  // 🚪 Logout function
  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        alert("Logged out successfully!");
        router.push("/");
      } else {
        console.error("Logout failed:", await res.text());
        alert("Logout failed. Try again.");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      onClose();
    }
  };

  // 📤 Avatar Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload-avatar", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setUser((prev) => (prev ? { ...prev, image: data.url } : prev));
        alert("Avatar updated successfully!");
      } else {
        alert("Failed to upload avatar.");
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Error uploading avatar. Try again later.");
    }
  };

  // 🎨 Color Palette options
  const colors = [
    { id: "blue", hex: "#3b82f6" },
    { id: "green", hex: "#22c55e" },
    { id: "orange", hex: "#f97316" },
    { id: "pink", hex: "#ec4899" },
    { id: "default", hex: "#4f46e5" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-96 max-w-full p-6 relative animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
        >
          <X size={20} />
        </button>

        {/* 👤 Header with dynamic avatar */}
        <div className="flex flex-col items-center space-y-3 mt-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[var(--theme-color)] shadow-lg">
              {user?.image ? (
                <img
                  src={user.image}
                  alt="User Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[var(--theme-color)]/10">
                  <User className="text-[var(--theme-color)]" size={40} />
                </div>
              )}
            </div>

            {/* 📤 Upload Icon */}
            <label
              htmlFor="avatarUpload"
              className="absolute bottom-1 right-1 bg-[var(--theme-color)] text-white p-2 rounded-full cursor-pointer hover:opacity-90 transition"
            >
              <Upload size={14} />
            </label>

            <input
              type="file"
              accept="image/*"
              id="avatarUpload"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {user ? user.name : "Loading..."}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {user ? user.email : ""}
          </p>
        </div>

        <hr className="my-5 border-gray-200 dark:border-gray-800" />

        {/* 🌗 Theme Preference */}
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
            Theme Preference
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setTheme("light")}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                theme === "light"
                  ? "bg-[var(--theme-color)] text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              <Sun size={16} /> Light
            </button>

            <button
              onClick={() => setTheme("dark")}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                theme === "dark"
                  ? "bg-[var(--theme-color)] text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              <Moon size={16} /> Dark
            </button>

            <button
              onClick={() => setTheme("system")}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                theme === "system"
                  ? "bg-[var(--theme-color)] text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              <Monitor size={16} /> System
            </button>
          </div>
        </div>

        {/* 🎨 Color Palette */}
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-2">
            <Palette size={16} /> Color Palette
          </h3>
          <div className="flex items-center gap-3">
            {colors.map((c) => (
              <button
                key={c.id}
                onClick={() => setColor(c.id)}
                className={`w-8 h-8 rounded-full transition-all border-2 ${
                  color === c.id
                    ? "border-[var(--theme-color)] scale-110"
                    : "border-transparent"
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>

        <hr className="my-5 border-gray-200 dark:border-gray-800" />

        {/* 🚪 Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg transition-all"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
