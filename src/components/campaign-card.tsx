// components/campaign-card.tsx
"use client";

import React from "react";

export default function CampaignCard({
  campaign,
  onView,
  onEdit,
  onDelete,
}: {
  campaign: any;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  const { id, name, description, status, startDate, leadsCount } = campaign;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{name}</h3>
          <p className="text-sm text-gray-500 mt-1">{description ?? "No description"}</p>
        </div>

        <div className="text-right">
          <span
            className={`inline-block text-xs px-2 py-1 rounded-full font-medium ${
              status === "active"
                ? "bg-green-100 text-green-800"
                : status === "scheduled"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {status}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <div>
          <div>Leads: <span className="font-medium">{leadsCount ?? 0}</span></div>
          <div>Start: <span className="font-medium">{startDate ? new Date(startDate).toLocaleDateString() : "-"}</span></div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => onView?.(id)} className="text-sm px-3 py-1 rounded-md border">
            View
          </button>
          <button onClick={() => onEdit?.(id)} className="text-sm px-3 py-1 rounded-md border">
            Edit
          </button>
          <button onClick={() => onDelete?.(id)} className="text-sm px-3 py-1 rounded-md border text-red-600">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
