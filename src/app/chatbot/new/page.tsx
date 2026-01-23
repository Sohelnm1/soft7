"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function NewBotPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/chatbots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description })
    });
    const bot = await res.json();
    router.push(`/chatbot/${bot.id}/builder`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Back Button */}
        <Link 
          href="/chatbot"
          className="absolute top-4 left-4 inline-flex items-center gap-2 text-green-900 hover:text-green-800 hover:bg-green-100 hover:px-3 hover:py-2 hover:rounded-lg transition-all duration-300 text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Chatbots</span>
        </Link>

        {/* Header */}
        <div className="text-center mb-6 hover:-translate-y-2 transition-transform duration-300 ease-out">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-300 shadow-lg shadow-emerald-200 mb-4 hover:border-4 hover:border-green-800 transition-all duration-300">
            <svg className="w-7 h-7 text-emerald-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Create New Chatbot
          </h1>
          <p className="text-gray-600">
            Set up your AI assistant in just a few steps
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          
          <form onSubmit={onSubmit} className="p-8 space-y-6">
            
            {/* Name Field */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-3">
                Bot Name <span className="text-red-500">*</span>
              </label>
              <input 
                value={name} 
                onChange={e => setName(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all outline-none text-base"
                placeholder="e.g., Customer Support Bot"
                required 
              />
              <p className="mt-2 text-sm text-gray-500">
                Choose a descriptive name for your chatbot
              </p>
            </div>
            
            {/* Description Field */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-3">
                Description <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all outline-none resize-none text-base"
                rows={5}
                placeholder="Describe what your chatbot does and how it helps users..."
              />
              <p className="mt-2 text-sm text-gray-500">
                Add details about your bot's purpose and capabilities
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <button 
                type="submit"
                className="flex-1 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-lg shadow-indigo-300 hover:shadow-xl hover:shadow-indigo-400 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300"
              >
                Create Chatbot
              </button>
              <Link
                href="/chatbot"
                className="px-8 py-4 rounded-2xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all duration-300 flex items-center justify-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>

        {/* Helper Text */}
        <p className="text-center text-sm text-gray-500 mt-6">
          You can customize your chatbot settings after creation
        </p>

      </div>
    </div>
  );
}