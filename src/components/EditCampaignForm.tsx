"use client";

import { useState } from "react";

type CampaignType = {
  id: string;
  name: string;
  type: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  leadsCount: number;
  description?: string | null;
};

type EditCampaignFormProps = {
  campaign: CampaignType;
  onSave: (updated: Partial<CampaignType>) => void;
  onCancel: () => void;
};

export function EditCampaignForm({ campaign, onSave, onCancel }: EditCampaignFormProps) {
  const [name, setName] = useState(campaign.name);
  const [type, setType] = useState(campaign.type);
  const [status, setStatus] = useState(campaign.status);
  const [startDate, setStartDate] = useState(campaign.startDate ? campaign.startDate.split("T")[0] : "");
  const [endDate, setEndDate] = useState(campaign.endDate ? campaign.endDate.split("T")[0] : "");
  const [leadsCount, setLeadsCount] = useState(campaign.leadsCount);
  const [description, setDescription] = useState(campaign.description || "");

  function handleSave() {
    onSave({
      name,
      type,
      status,
      startDate: startDate ? new Date(startDate).toISOString() : null,
      endDate: endDate ? new Date(endDate).toISOString() : null,
      leadsCount,
      description,
    });
  }

  return (
    <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h2 className="text-xl font-semibold text-gray-800">Edit Campaign</h2>
      </div>

      <div className="p-6 max-h-[80vh] overflow-y-auto flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-gray-700">
          Name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-gray-700">
          Type
          <input
            type="text"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-gray-700">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-gray-700">
            Start Date
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <label className="flex flex-col gap-1 text-gray-700">
            End Date
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-gray-700">
          Leads Count
          <input
            type="number"
            value={leadsCount}
            onChange={(e) => setLeadsCount(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-gray-700">
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={4}
          />
        </label>
      </div>

      <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
        <button
          onClick={onCancel}
          className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </div>
  );
}
