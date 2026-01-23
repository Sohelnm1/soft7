'use client';

import Link from "next/link";
import React, { useState, useEffect } from "react";
import {
  PlusCircle,
  Edit,
  Trash2,
  Loader2,
  Bot,
  Phone,
  Tag,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

interface FaqItem {
  id: number;
  name: string;
  phone: string;
  faqBotId: string;
}

export default function ChatbotFAQPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [blur, setBlur] = useState(false);


  // Modal
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form States
  const [botName, setBotName] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  // Inline validation & success
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/chatbot-faq");
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setFaqs(data);
    } catch (err) {
      toast.error("Failed to load Chatbot FAQs.");
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete FAQ Bot "${name}"? This cannot be undone.`)) return;

    const loadingToastId = toast.loading(`Deleting ${name}...`);

    try {
      const res = await fetch("/api/chatbot-faq/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error("Failed to delete FAQ bot.");

      toast.success(`${name} deleted successfully!`, { id: loadingToastId });
      fetchFaqs();
    } catch (error) {
      console.error("Delete Error:", error);
      toast.error("Could not delete bot. Please try again.", { id: loadingToastId });
    }
  };

  const startEdit = (faq: FaqItem) => {
    window.location.href = `/chatbot-faq/edit/${faq.id}`;
  };
return (
  <div
  className={`p-6 sm:p-10 max-w-7xl mx-auto transition-all duration-300 
    ${blur ? "blur-md brightness-75 pointer-events-none" : ""}`}
>

    {/* HEADER */}
    <div className="flex flex-col sm:flex-row justify-between items-center mb-12 gap-4">
      <div className="flex items-center gap-3">
        <Bot className="text-indigo-600 w-9 h-9" />
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
          Chatbot FAQ Manager
        </h1>
      </div>
      <Link
  href="/chatbot-faq/create"
  onClick={() => setBlur(true)}
  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 
             text-white px-6 py-3 rounded-xl shadow-md 
             transition-all duration-300 hover:shadow-xl hover:scale-[1.05]"
>
  <PlusCircle size={20} />
  Create New FAQ Bot
</Link>

      
    </div>

    {/* LOADING STATE */}
    {loading && (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-indigo-600">
        <Loader2 className="animate-spin" size={42} />
        <p className="mt-4 text-lg font-medium">Fetching your bots...</p>
      </div>
    )}

    {/* EMPTY STATE */}
    {!loading && faqs.length === 0 && (
      <div className="bg-white border border-gray-200 p-14 rounded-3xl shadow-xl 
                      text-center min-h-[330px] flex flex-col justify-center items-center">
        <Bot size={70} className="text-gray-400 mb-5" />

        <p className="text-2xl font-semibold text-gray-800 mb-3">
          No FAQ Bots Yet
        </p>

        <p className="text-gray-500 max-w-md mb-7">
          Create your first FAQ bot to automate customer responses with ease.
        </p>

        <Link
          href="/chatbot-faq/create"
          className="flex items-center gap-2 text-indigo-600 hover:text-green-600 
                     font-semibold transition-all duration-200"
        >
          <PlusCircle size={18} />
          Create one now
        </Link>
      </div>
    )}

    {/* FAQ CARDS */}
    {!loading && faqs.length > 0 && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {faqs.map((faq) => (
          <div
            key={faq.id}
            className="bg-white border border-gray-200 rounded-3xl p-7 shadow-md
                       backdrop-blur-sm hover:shadow-2xl hover:border-indigo-300 
                       transition-all duration-300"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 truncate">
                  <Bot className="text-indigo-500 w-5 h-5" />
                  {faq.name}
                </h2>

                <span className="text-xs font-semibold bg-green-100 text-green-600 
                                 py-1 px-3 rounded-full shadow-sm">
                  LIVE
                </span>
              </div>

              {/* BOT ID */}
              <p className="flex items-center text-gray-600 mb-2 text-sm">
                <Tag className="mr-2 text-gray-400" size={16} />
                ID:
                <span className="font-mono text-gray-900 ml-1">{faq.faqBotId}</span>
              </p>

              {/* PHONE */}
              <p className="flex items-center text-gray-600 mb-4 text-sm">
                <Phone className="mr-2 text-gray-400" size={16} />
                Phone:
                <span className="font-mono text-gray-900 ml-1">{faq.phone || "N/A"}</span>
              </p>

              {/* TIMESTAMP */}
              <div className="text-xs text-gray-400 border-t pt-3">
                Last updated: {new Date().toLocaleDateString()}
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex justify-end mt-4 pt-4 border-t border-gray-100 space-x-3">
              <button
                onClick={() => startEdit(faq)}
                className="flex items-center gap-1 text-sm font-semibold 
                           text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg 
                           hover:bg-indigo-100 transition-all"
              >
                <Edit size={16} />
                Edit
              </button>

              <button
                onClick={() => handleDelete(faq.id, faq.name)}
                className="flex items-center gap-1 text-sm font-semibold 
                           text-red-600 bg-red-50 px-3 py-2 rounded-lg 
                           hover:bg-red-100 transition-all"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);
}
