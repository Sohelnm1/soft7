"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Users, Building2, CreditCard } from "lucide-react";

export function SettingsSidebar() {
  const pathname = usePathname();

  const links = [
    { name: "Profile", icon: User, href: "/settings/profile" },
    { name: "Team", icon: Users, href: "/settings/team" },
    { name: "Organization", icon: Building2, href: "/settings/organization" },
    { name: "Billing", icon: CreditCard, href: "/settings/billing" },
  ];

  return (
    <aside
      className="
        w-44
        bg-green-100
        border-t border-r border-b border-l border-black   /* 👈 full black border */
        rounded-2xl
        p-4
        flex flex-col justify-between
        text-gray-800
        box-border
      "
    >
      <div className="text-xl font-semibold text-center">Settings</div>

      <div className="space-y-4 mt-6">
        {links.map(({ name, icon: Icon, href }) => {
          const active = pathname === href;
          return (
            <Link
              key={name}
              href={href}
              className={`w-full flex flex-col items-center text-center py-3 px-2 rounded-lg border border-black transition-all duration-200 ${
                active
                  ? "bg-green-300 text-gray-900 font-semibold"
                  : "text-gray-700 hover:text-gray-900 hover:bg-green-200"
              }`}
            >
              <Icon size={22} className="mb-1" />
              <span className="text-sm">{name}</span>
            </Link>
          );
        })}
      </div>

      <div className="text-xs text-gray-600 flex flex-col items-center gap-1 mb-1">
        {/* Optional footer */}
      </div>
    </aside>
  );
}
