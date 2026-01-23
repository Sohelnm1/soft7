"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function CampaignsTopbar({ onSearch }: { onSearch?: (q: string) => void }) {
  const router = useRouter();

  return (
    <div className="w-full flex flex-col gap-4 mb-6">

      {/* TITLE */}
      <div>
        <h1 className="page-title text-5xl font-bold leading-tight">Campaigns</h1>
        <p className="text-2xl text-muted-foreground">Manage and launch campaigns</p>
      </div>

      {/* SEARCH + BUTTON ROW */}
      <div className="w-full flex justify-end items-center gap-4">

        {/* SEARCH BOX */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
            size={18}
          />

          <input
            type="search"
            placeholder="Search campaigns..."
            className="
              w-60
              pl-11            /* <-- IMPORTANT FIX */
              pr-3 py-2
              border rounded-lg
              focus:outline-none focus:ring-2 focus:ring-indigo-400
              text-sm
            "
            style={{ paddingLeft: "2.8rem" }}  /* <-- HARD OVERRIDE (Fixes overlap 100%) */
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>

        {/* CREATE BUTTON */}
        <button
          onClick={() => router.push('/campaigns/create')}
          className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
        >
          + Create Campaign
        </button>

      </div>
    </div>
  );
}
