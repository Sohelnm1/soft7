"use client";
import { usePathname, useRouter } from "next/navigation";
import { Settings, User, Users, Building2, CreditCard } from "lucide-react";
import { useState, useEffect } from "react";

const navigationItems = [
  {
    name: "Profile",
    href: "/settings/profile",
    icon: User,
    description: "Personal information"
  },
  {
    name: "Team",
    href: "/settings/team",
    icon: Users,
    description: "Team management"
  },
  {
    name: "Organization",
    href: "/settings/organization",
    icon: Building2,
    description: "Organization settings"
  },
  {
    name: "Billing",
    href: "/settings/billing",
    icon: CreditCard,
    description: "Payment & billing"
  }
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Navigation Tabs - topbar buttons (visible on all sizes) */}
            <nav className="flex flex-wrap items-center space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <button
                    key={item.name}
                    onClick={() => router.push(item.href)}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 shadow-sm"
                        : "text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-50"
                    }`}>
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                    {isActive && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* (Removed mobile-only title; navigation buttons now shown in topbar) */}
          </div>
        </div>
        
      </div>

      {/* Main Content - Scrolls naturally */}
      <main className="flex-1 overflow-visible">
        {children}
      </main>
    </div>
  );
}