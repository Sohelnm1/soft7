"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      className={`
        h-10 w-10 rounded-full
        flex items-center justify-center

        shadow-md hover:shadow-lg
        transition-all duration-300
        hover:-translate-y-1 active:scale-95

        bg-gradient-to-br
        ${isDark
          ? "from-orange-400 to-purple-600 text-white"
          : "from-orange-200 to-yellow-300 text-white"}
      `}
    >
      {isDark ? (
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          style={{
            fill: "currentColor",
            stroke: "currentColor",
            strokeWidth: 1,
          }}
        >
          <path d="M12 2a9 9 0 1 0 8 13A7 7 0 1 1 12 2z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <circle cx="12" cy="12" r="5" />
          <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="1" x2="12" y2="4" />
            <line x1="12" y1="20" x2="12" y2="23" />
            <line x1="1" y1="12" x2="4" y2="12" />
            <line x1="20" y1="12" x2="23" y2="12" />
            <line x1="4.2" y1="4.2" x2="6.3" y2="6.3" />
            <line x1="17.7" y1="17.7" x2="19.8" y2="19.8" />
            <line x1="4.2" y1="19.8" x2="6.3" y2="17.7" />
            <line x1="17.7" y1="6.3" x2="19.8" y2="4.2" />
          </g>
        </svg>
      )}
    </button>
  );
}
