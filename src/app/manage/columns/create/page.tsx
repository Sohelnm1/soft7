"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

import {
  ChevronLeft,
  Save,
  AlertTriangle,
  CheckCircle,
  Loader2,
  X,
  XCircle,
} from "lucide-react";

interface MessageBannerProps {
  type: "success" | "error";
  text: string;
  onClose: () => void;
}

/* Polished message banner */
const MessageBanner = ({ type, text, onClose }: MessageBannerProps) => {
  const isSuccess = type === "success";
  const bgColor = isSuccess ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200";
  const textColor = isSuccess ? "text-green-800" : "text-red-800";
  const Icon = isSuccess ? CheckCircle : AlertTriangle;

  return (
    <div
      role="status"
      className={`p-4 mb-5 border-l-4 rounded-r-lg ${bgColor} flex items-start justify-between shadow-sm`}
    >
      <div className="flex items-center">
        <Icon className={`w-5 h-5 mr-3 ${isSuccess ? "text-green-500" : "text-red-500"}`} />
        <p className={`text-sm font-medium ${textColor}`}>{text}</p>
      </div>
      <button onClick={onClose} aria-label="Dismiss message" className="text-gray-400 hover:text-gray-700 ml-4 transition">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default function CreateColumn() {
  const router = useRouter();

  const [form, setForm] = useState({
    label: "",
    type: "",
    visible: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.label || !form.type) {
      setMessage({ type: "error", text: "Please fill label and select a data type." });
      return;
    }

    setMessage(null);
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((r) => setTimeout(r, 900));

      // Mock success
      setMessage({ type: "success", text: `Column '${form.label}' created successfully!` });
      setForm({ label: "", type: "", visible: true });

      // Redirect back to the columns page after short delay
      setTimeout(() => router.push("/manage/columns"), 1200);
    } catch (error) {
      console.error("API Error:", error);
      setMessage({ type: "error", text: `Failed to create column. ${(error as Error)?.message ?? "Unknown error"}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center p-6 sm:p-10">
   <div className="create-column-card max-w-xl w-full p-8 rounded-2xl shadow-2xl border">


        {/* Back */}
        <button
  onClick={() => router.push("/manage/columns")}
  className="inline-flex items-center gap-2 px-4 py-2 rounded-full 
             bg-gray-100 text-gray-700 font-medium shadow-sm
             hover:bg-red-600 hover:text-red-600
             transition-all duration-200 mb-6"
  disabled={isLoading}
>
  <ChevronLeft className="w-4 h-4" /> Back
</button>


        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">New Data Column</h2>
        <p className="text-gray-600 mb-6">
          Define the structure and properties of your new custom data field.
        </p>

        {/* Message */}
        {message && <MessageBanner type={message.type} text={message.text} onClose={() => setMessage(null)} />}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Label */}
          <div>
            <label htmlFor="label" className="block text-sm font-semibold text-gray-800 mb-2">
              Column Label
            </label>
            <div className="relative">
              <input
                id="label"
                autoComplete="off"
                placeholder="e.g., Customer Segment, Last Contact Date"
                value={form.label}
                onChange={(e) => setForm((s) => ({ ...s, label: e.target.value }))}
                required
                disabled={isLoading}
                className="w-full h-12 rounded-xl px-4 pr-12 text-sm text-gray-800 placeholder-gray-400 border border-gray-300 transition focus:ring-2 focus:ring-green-200 focus:border-green-400 outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
              {form.label && (
                <button
                  type="button"
                  onClick={() => setForm((s) => ({ ...s, label: "" }))}
                  aria-label="Clear"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Type select */}
          <div>
            <label htmlFor="type" className="block text-sm font-semibold text-gray-800 mb-2">
              Data Type
            </label>
           <div className="relative">
  <select
    id="type"
    value={form.type}
    onChange={(e) => setForm({ ...form, type: e.target.value })}
    required
    disabled={isLoading}
    className="w-full h-12 rounded-xl px-4 pr-12 text-sm text-gray-800 border border-gray-300 bg-white
               appearance-none
               transition focus:ring-2 focus:ring-green-200 focus:border-green-400 outline-none
               disabled:bg-gray-50 disabled:cursor-not-allowed"
  >
    <option value="" disabled>Select the data type</option>
    <option value="TEXT">Text (Short/Long strings)</option>
    <option value="NUMBER">Number (Integers or Decimals)</option>
    <option value="DATE">Date (Calendar date)</option>
    <option value="BOOLEAN">Checkbox (True/False)</option>
  </select>

  {/* Dropdown icon */}
  <ChevronDown
    className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none"
  />
</div>
   </div>

          {/* Visible toggle (custom) */}
    {/* Visibility Toggle */}
<div className="flex items-center pt-3">
  <label
    htmlFor="visible"
    className="flex items-center cursor-pointer select-none text-sm"
  >
    {/* hidden checkbox */}
    <input
      type="checkbox"
      id="visible"
      checked={form.visible}
      onChange={(e) => setForm({ ...form, visible: e.target.checked })}
      disabled={isLoading}
      className="hidden"
    />

    {/* Switch */}
    <div
      className={`
        w-12 h-7 rounded-full flex items-center p-1 transition-all duration-300
        ${form.visible ? "bg-indigo-600" : "bg-gray-300"}
      `}
    >
      <div
        className={`
          w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300
          ${form.visible ? "translate-x-5" : "translate-x-0"}
        `}
      />
    </div>

    <span className="ml-4 text-gray-800 font-medium">Visible to Users</span>
    <span className="text-gray-500 ml-2">(Determines if the column appears in reports and views)</span>
  </label>
</div>


          {/* Submit */}
          <button
  type="submit"
  disabled={isLoading || !form.label || !form.type}
  className="create-column-button w-full flex items-center justify-center py-3 rounded-xl font-semibold text-lg shadow-md mt-6"
>

  {isLoading ? (
    <>
      <Loader2 className="w-5 h-5 animate-spin text-white dark:text-white" />
      <span className="text-white dark:text-white">Creating...</span>
    </>
  ) : (
    <>
      <Save className="w-5 h-5 text-white dark:text-white" />
      <span className="text-white dark:text-white">Create Column</span>
    </>
  )}
</button>


        </form>
      </div>
    </div>
  );
}
