"use client";

import { useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";

interface Contact {
  name: string;
  phone: string;
  email: string;
  [key: string]: any;
}

interface ExportContactsProps {
  contacts: Contact[]; // kept for future selected export
  onClose: () => void;
}

export default function ExportContacts({
  contacts,
  onClose,
}: ExportContactsProps) {
  const [loading, setLoading] = useState(false);
  const exportCount = 1; // currently only CSV

  // 🔥 Component mount log (SAFE PLACE)
  useEffect(() => {
    console.log("✅ ExportContacts component mounted");
    console.log("............. MODAL IS RENDERED .............");

    return () => {
      console.log("❎ ExportContacts component unmounted");
    };
  }, []);

  const downloadCSV = async () => {
    console.log("🔥 EXPORT CLICK HANDLER FIRED");
    console.log("............. BUTTON CLICK CONFIRMED .............");

    try {
      setLoading(true);
      console.log("🚀 CALLING /api/contacts/export");

      const res = await fetch("/api/contacts/export", {
        method: "GET",
        credentials: "include",
      });

      console.log("📥 Export response received:", res.status);

      if (!res.ok) {
        throw new Error("Export failed");
      }

      const blob = await res.blob();
      console.log("📦 CSV Blob size:", blob.size);

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "contacts_export.csv";
      document.body.appendChild(link);

      console.log("⬇️ Triggering file download");
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);

      console.log("✅ File download triggered");

      alert("✅ Contacts exported successfully!");

      // Give browser time to start download
      setTimeout(() => {
        console.log("❎ Closing export modal");
        onClose();
      }, 300);
    } catch (error) {
      console.error("❌ Export error:", error);
      alert("❌ Failed to export contacts");
    } finally {
      console.log("🧹 Export process finished");
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={() => {
        console.log("⚠️ Backdrop clicked – closing modal");
        onClose();
      }}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl space-y-5"
        onClick={(e) => {
          e.stopPropagation();
          console.log("🛑 Modal click – propagation stopped");
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Export Contacts
            </h2>
            <p className="text-gray-500 text-sm">
              Download your contacts as a CSV file
            </p>
          </div>

          <button
            onClick={() => {
              console.log("❎ Close button clicked");
              onClose();
            }}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition text-xl font-bold"
          >
            &times;
          </button>
        </div>

        {/* Export Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("🟢 Export button clicked");
            downloadCSV();
          }}
          disabled={loading}
          className={`w-full flex items-center justify-between px-4 py-2 rounded-xl font-medium shadow transition
            ${
              loading
                ? "bg-orange-300 cursor-not-allowed"
                : "bg-orange-500 hover:bg-orange-600 text-white"
            }`}
        >
          <span>
            {loading ? "Exporting contacts..." : "Export All Contacts"}
          </span>

          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Download className="w-5 h-5" />
          )}
        </button>

        {/* Info */}
        <p className="text-xs text-gray-400 text-center">
          {exportCount} export format{exportCount > 1 ? "s" : ""} available
        </p>
      </div>
    </div>
  );
}
