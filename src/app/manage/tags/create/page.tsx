"use client";

import { useState } from "react";
import { ArrowLeft, Save, Tag as TagIcon, XCircle, CheckCircle, Loader2 } from "lucide-react";

interface Notification {
  message: string;
  type: "error" | "success";
}

/* Toast Notification */
const NotificationToast = ({ notification }: { notification: Notification | null }) => {
  if (!notification) return null;

  return (
    <div
      className={`fixed top-4 right-4 p-4 rounded-xl shadow-2xl flex items-center space-x-3 z-50 transition-all duration-300 
          ${
            notification.type === "success"
              ? "bg-teal-100 border border-teal-300 text-teal-800"
              : "bg-red-100 border border-red-300 text-red-800"
          }`}
      role="alert"
    >
      {notification.type === "success" ? (
        <CheckCircle className="w-5 h-5" />
      ) : (
        <XCircle className="w-5 h-5" />
      )}
      <p className="text-sm font-medium">{notification.message}</p>
    </div>
  );
};

export default function CreateTagPage() {
  const [tagName, setTagName] = useState("");
  const [tagGroup, setTagGroup] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);

  const showNotification = (message: string, type: "error" | "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const navigateToTags = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/manage/tags";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTagName = tagName.trim();
    if (!trimmedTagName) {
      showNotification("Tag Name is required.", "error");
      return;
    }

    setLoading(true);

    const payload = {
      name: trimmedTagName,
      group: tagGroup.trim() || null,
    };

    try {
      const res = await fetch("/api/tags/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showNotification(`Tag '${trimmedTagName}' created successfully!`, "success");
        setTimeout(navigateToTags, 600);
      } else {
        const errorText = await res.text();
        let errorMessage = "Failed to create tag.";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch {}
        showNotification(errorMessage, "error");
      }
    } catch {
      showNotification("Network error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-orange-50 via-white to-orange-100">
      <NotificationToast notification={notification} />

      <div className="w-full max-w-lg p-8 rounded-3xl border border-orange-200/50 shadow-2xl backdrop-blur-2xl bg-white/90 transition-all">
        
        {/* Back Button */}
        <a
          href="/manage/tags"
          className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-medium transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tags
        </a>

        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2 mb-2">
          <TagIcon className="w-7 h-7 text-orange-500" />
          Create New Tag
        </h1>
        <p className="text-gray-500 mb-8 text-sm">
          Add a tag name and optionally assign it to a related group.
        </p>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tag Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tag Name <span className="text-red-500">*</span>
            </label>
            <input
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              placeholder="e.g. Important"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
            />
          </div>

          {/* Tag Group */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tag Group (Optional)
            </label>
            <input
              value={tagGroup}
              onChange={(e) => setTagGroup(e.target.value)}
              placeholder="e.g. Priority"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
            />
            <p className="text-xs text-gray-400 mt-1">Group logically connects similar tags.</p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white bg-orange-500 hover:bg-orange-600 transition shadow-lg shadow-orange-300/50 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {loading ? "Saving..." : "Save Tag"}
          </button>
        </form>
      </div>
    </div>
  );
}
