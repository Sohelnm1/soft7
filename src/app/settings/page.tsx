"use client";
import {
  Settings,
  User,
  Users,
  Building2,
  CreditCard,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function SettingsIndex() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const gradientStyles = {
    green: "linear-gradient(135deg, #10b981 0%, #6ee7b7 100%)",
    lightGreen: "linear-gradient(135deg, #0ca36c 0%, #50e8a1 100%)",
    emerald: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
    teal: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
  };

  const settingsSections = [
    {
      icon: User,
      title: "Profile",
      description: "Manage your personal information and account details",
      href: "/settings/profile",
      gradientStyle: gradientStyles.green,
      lightBg: "bg-green-50",
      darkBg: "bg-green-950",
      lightBorder: "border-green-200",
      darkBorder: "border-green-800",
    },
    {
      icon: Users,
      title: "Team",
      description: "Invite members and manage team permissions",
      href: "/settings/team",
      gradientStyle: gradientStyles.lightGreen,
      lightBg: "bg-emerald-50",
      darkBg: "bg-emerald-950",
      lightBorder: "border-emerald-200",
      darkBorder: "border-emerald-800",
    },
    {
      icon: Building2,
      title: "Organization",
      description: "Configure organization settings and preferences",
      href: "/settings/organization",
      gradientStyle: gradientStyles.emerald,
      lightBg: "bg-teal-50",
      darkBg: "bg-teal-950",
      lightBorder: "border-teal-200",
      darkBorder: "border-teal-800",
    },
    {
      icon: CreditCard,
      title: "Billing",
      description: "View invoices and manage payment methods",
      href: "/settings/billing",
      gradientStyle: gradientStyles.teal,
      lightBg: "bg-cyan-50",
      darkBg: "bg-cyan-950",
      lightBorder: "border-cyan-200",
      darkBorder: "border-cyan-800",
    },
  ];

  return (
    <div className="min-h-screen p-8 transition-colors duration-300">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="p-3 rounded-xl"
            style={{
              background: "linear-gradient(to bottom right, #10b981, #6ee7b7)",
            }}
          >
            <Settings className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold force-dark-green">Settings</h1>
        </div>
        <p className="force-dark-green text-lg ml-1">
          Manage your account, team, and organization preferences
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {settingsSections.map((section, index) => {
          const Icon = section.icon;

          return (
            <Link
              key={index}
              href={section.href}
              style={{
                backgroundColor: "transparent",
              }}
            >
              <div
                className={`group cursor-pointer rounded-2xl p-6 border
                ${
                  isDark
                    ? `${section.darkBg} ${section.darkBorder}`
                    : `${section.lightBg} ${section.lightBorder} hover:bg-opacity-70`
                }
                hover:shadow-xl hover:-translate-y-1
                transition-all duration-300`}
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div
                    className="p-5 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300"
                    style={{ background: section.gradientStyle }}
                  >
                    <Icon className="w-10 h-10 text-white" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-center mb-2">
                      <h3
                        className={`text-xl font-semibold ${
                          isDark ? "text-white" : "text-gray-900"
                        } group-hover:translate-x-0.5 transition-all`}
                      >
                        {section.title}
                      </h3>

                      <ChevronRight
                        className={`w-5 h-5 ml-2 ${
                          isDark ? "text-gray-500" : "text-gray-400"
                        } group-hover:translate-x-1 transition-all`}
                      />
                    </div>

                    <p
                      className={`text-sm ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {section.description}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}