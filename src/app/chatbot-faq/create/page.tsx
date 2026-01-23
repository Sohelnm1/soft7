"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bot, CornerDownRight, PlusCircle, Loader2, ChevronLeft } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function CreateChatbotFAQPage() {
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // ✅ ADD THIS (only update you requested)
 useEffect(() => {
  const main = document.getElementById("app-main");
  if (main) main.classList.add("page-dimmed");

  return () => {
    if (main) main.classList.remove("page-dimmed");
  };
}, []);


  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !phone) {
      toast.error("Please enter bot name and phone number.");
      return;
    }

    setIsSubmitting(true);
    const t = toast.loading("Creating FAQ Bot...");

    try {
      const res = await fetch("/api/chatbot-faq/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, countryCode }),
      });

      if (res.ok) {
        toast.success("Bot created successfully!", { id: t });
        setTimeout(() => router.push("/chatbot-faq"), 700);
      } else {
        const msg = await res.json().catch(() => null);
        toast.error(msg?.error || "Failed to create FAQ Bot.", { id: t });
      }
    } catch (err) {
      toast.error("Unexpected error! Try again.", { id: t });
    } finally {
      setIsSubmitting(false);
    }
  };
return (
  <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-xl flex items-center justify-center p-4">

    <Toaster />

    <form
  onSubmit={handleCreate}
  className="
    faq-modal max-w-lg
    mx-auto
    bg-white/70
    backdrop-blur-2xl
    border border-white/40
    shadow-[0_10px_50px_rgba(0,0,0,0.20)]
    rounded-3xl
    p-10
    animate-[fadeIn_0.3s_ease]
  "
>
  


      {/* BACK BUTTON */}
      <button
  type="button"
  onClick={() => router.push("/chatbot-faq")}
  className="
    flex items-center gap-2 mb-8 
    text-black font-medium
    hover:text-black 
    bg-transparent
    px-4 py-2 rounded-full
    transition-all
    hover:bg-green-600 
  "
>
  <ChevronLeft className="w-5 h-5" />
  Back
</button>


      {/* HEADER */}
      <div className="text-center mb-10">
        <div className="flex justify-center mb-5">
          <div className="p-5 bg-blue-100/50 rounded-2xl shadow-inner">
            <Bot className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold">
          Create New FAQ Bot
        </h1>
        <p className="text-gray-500 dark:text-black mt-2 text-sm">

          Configure details for your automated assistant.
        </p>
      </div>

      {/* BOT NAME */}
      <div className="mb-7">
      <label className="block mb-2 font-medium text-gray-700 dark:text-black text-sm">

          Bot Name
        </label>

        <input
          type="text"
          value={name}
          placeholder="Support Assistant, Sales FAQ..."
          onChange={(e) => setName(e.target.value)}
          disabled={isSubmitting}
          className="
            w-full 
            px-4 py-3 
            rounded-2xl 
            bg-white/80 
            border border-gray-300 
            outline-none
            focus:ring-4 focus:ring-blue-300/40 
            focus:border-blue-500
            transition
          "
          required
        />

<p className="text-xs text-gray-500 dark:text-black mt-1 flex items-center">

          <CornerDownRight className="w-3 h-3 mr-1" />
          This name identifies the bot.
        </p>
      </div>

      {/* PHONE INPUT */}
      <div className="mb-10">
        <label className="block mb-2 font-medium text-gray-700 text-sm">
          Associated Phone Number
        </label>

        <div className="flex gap-3">
          {/* COUNTRY CODE */}
          <input
            list="countryCodes"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            disabled={isSubmitting}
            className="
              w-28 
              px-3 py-3 
              text-center
              rounded-2xl 
              bg-white/80 
              border border-gray-300 
              focus:ring-4 focus:ring-blue-300/40 
              focus:border-blue-500
              transition
            "
            required
          />

          <datalist id="countryCodes">
            <option value="+1" label="USA / Canada" />
            <option value="+91" label="India" />
            <option value="+44" label="UK" />
            <option value="+971" label="UAE" />
            <option value="+61" label="Australia" />
            <option value="+81" label="Japan" />
          </datalist>

          {/* PHONE */}
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="5551234567"
            disabled={isSubmitting}
            className="
              flex-grow 
              px-4 py-3 
              rounded-2xl
              bg-white/80 
              border border-gray-300 
              focus:ring-4 focus:ring-blue-300/40 
              focus:border-blue-500 
              outline-none
              transition
            "
            required
          />
        </div>

        <p className="text-xs text-gray-500 dark:text-black mt-1 flex items-center">

          <CornerDownRight className="w-3 h-3 mr-1" />
          Connects bot to WhatsApp/SMS.
        </p>
      </div>

      {/* SUBMIT BUTTON */}
   <button
  type="submit"
  disabled={isSubmitting}
  className="
    w-full 
    flex items-center justify-center 
    bg-green-600 text-white 
    font-semibold text-lg 
    py-3 
    rounded-2xl 
    shadow-lg 
    hover:bg-green-700 
    active:scale-95 
    transition 
    disabled:bg-green-400 disabled:cursor-not-allowed
  "
>
  {isSubmitting ? (
    <Loader2 className="animate-spin w-5 h-5 mr-2" />
  ) : (
    <PlusCircle size={20} className="mr-2" />
  )}
  {isSubmitting ? "Creating..." : "Create Bot"}
</button>

    </form>
  </div>
);
}
