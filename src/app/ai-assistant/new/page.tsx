
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Upload, X, FileText } from "lucide-react";

export default function NewAIAssistantPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("settings");
  const [assistantName, setAssistantName] = useState("");
  const [promptMode, setPromptMode] = useState("predefined");
  const [agentRole, setAgentRole] = useState("Customer Support Agent");
  const [customPrompt, setCustomPrompt] = useState("");
  const [aiProvider, setAiProvider] = useState("OpenAI");
  const [model, setModel] = useState("GPT-4o");
  const [apiKey, setApiKey] = useState("");
  const [knowledgeFiles, setKnowledgeFiles] = useState<any[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);

  const agentRoles = [
    "Customer Support Agent",
    "Coding Assistant",
    "Sales Assistant",
    "General Assistant",
  ];

  const aiProviders: Record<string, string[]> = {
    OpenAI: ["GPT-4o", "GPT-4o Mini", "GPT-4 Turbo", "GPT-4", "GPT-3.5 Turbo"],
    Anthropic: ["Claude 3.5 Sonnet", "Claude 3 Opus", "Claude 3 Sonnet", "Claude 3 Haiku"],
    "Google Gemini": ["Gemini 1.5 Pro", "Gemini 1.5 Flash", "Gemini 1.0 Pro"],
  };

  // -------------------------------
  // 🧩 Drag & Drop File Handlers
  // -------------------------------
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = [...e.dataTransfer.files];
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles([...e.target.files]);
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter((file) => {
      const isValidType =
        file.name.endsWith(".txt") ||
        file.name.endsWith(".pdf") ||
        file.name.endsWith(".doc") ||
        file.name.endsWith(".docx");
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      return isValidType && isValidSize;
    });

    const newFiles = validFiles.map((file) => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size:
        file.size < 1024
          ? file.size + " B"
          : file.size < 1048576
          ? (file.size / 1024).toFixed(2) + " KB"
          : (file.size / 1048576).toFixed(2) + " MB",
      type: file.name.split(".").pop()?.toUpperCase() || "FILE",
    }));

    setKnowledgeFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (id: number) => {
    setKnowledgeFiles(knowledgeFiles.filter((file) => file.id !== id));
  };

  // -------------------------------
  // 💾 Save Assistant (POST /api/ai-assistant)
  // -------------------------------
  const handleSave = async () => {
    if (!assistantName.trim()) {
      alert("Please enter an assistant name");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: assistantName,
        role: agentRole,
        status: "active",
        promptType: promptMode,
        predefinedPrompt: promptMode === "predefined" ? agentRole : null,
        customPrompt: promptMode === "custom" ? customPrompt : null,
        provider: aiProvider,
        model,
        apiKey: apiKey || null,
      };

      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create assistant");

      alert("✅ Assistant created successfully!");
      router.push("/ai-assistant");
    } catch (error) {
      console.error(error);
      alert("❌ Something went wrong while saving assistant.");
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = (provider: string) => {
    setAiProvider(provider);
    setModel(aiProviders[provider][0]);
  };

  // -------------------------------
  // 🎨 UI Rendering
  // -------------------------------
  return (
    <div className="min-h-screen bg-white dark:bg-[#0b0c10] text-gray-900 dark:text-white p-8">
      <h1 className="text-3xl font-semibold mb-6">Create AI Assistant</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        {["settings", "knowledge"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              activeTab === tab
                ? "bg-[#5d12ea] text-white"
                : "bg-gray-200 dark:bg-[#1a1b1f] text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-[#25262b]"
            }`}
          >
            {tab === "settings" ? "Settings" : "Knowledge Base"}
          </button>
        ))}
      </div>

      {/* -------------------- SETTINGS TAB -------------------- */}
      {activeTab === "settings" && (
        <div className="space-y-6 max-w-5xl">
          {/* Basic Info */}
          <section className="bg-gray-50 dark:bg-[#111217] p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-[#5d12ea]">Basic Information</h2>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Assistant Name
            </label>
            <input
              type="text"
              value={assistantName}
              onChange={(e) => setAssistantName(e.target.value)}
              placeholder="e.g., Customer Support Bot, Sales Assistant..."
              className="w-full bg-white dark:bg-[#15171c] border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-gray-900 dark:text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#5d12ea]"
            />
          </section>

          {/* Prompt Configuration */}
          <section className="bg-gray-50 dark:bg-[#111217] p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-[#5d12ea]">Prompt Configuration</h2>

            <div className="flex gap-2 bg-gray-100 dark:bg-[#15171c] rounded-lg p-1 w-fit mb-6">
              {["predefined", "custom"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setPromptMode(mode)}
                  className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${
                    promptMode === mode
                      ? "bg-[#5d12ea] text-white"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  {mode === "predefined" ? "Predefined Prompts" : "Custom Prompt"}
                </button>
              ))}
            </div>

            {promptMode === "predefined" ? (
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Select Agent Role
                </label>
                <div className="relative">
                  <select
                    value={agentRole}
                    onChange={(e) => setAgentRole(e.target.value)}
                    className="w-full bg-white dark:bg-[#15171c] border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-gray-900 dark:text-gray-200 appearance-none focus:border-[#5d12ea] cursor-pointer"
                  >
                    {agentRoles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Customize Prompt
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="w-full h-36 bg-white dark:bg-[#15171c] border border-gray-300 dark:border-gray-700 rounded-lg p-4 text-gray-900 dark:text-gray-200 focus:border-[#5d12ea] resize-none"
                  placeholder="Enter your custom prompt here..."
                />
              </div>
            )}
          </section>

          {/* AI Configuration */}
          <section className="bg-gray-50 dark:bg-[#111217] p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-[#5d12ea]">AI Configuration</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Provider */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">AI Provider</label>
                <select
                  value={aiProvider}
                  onChange={(e) => handleProviderChange(e.target.value)}
                  className="w-full bg-white dark:bg-[#15171c] border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-gray-900 dark:text-gray-200 focus:border-[#5d12ea]"
                >
                  {Object.keys(aiProviders).map((provider) => (
                    <option key={provider}>{provider}</option>
                  ))}
                </select>
              </div>

              {/* Model */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Model</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-white dark:bg-[#15171c] border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-gray-900 dark:text-gray-200 focus:border-[#5d12ea]"
                >
                  {aiProviders[aiProvider].map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* API Key */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
                className="w-full bg-white dark:bg-[#15171c] border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-gray-900 dark:text-gray-200 focus:border-[#5d12ea]"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={loading}
                className={`bg-[#5d12ea] hover:bg-[#6d22fa] text-white font-semibold px-8 py-3 rounded-lg transition-all ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {loading ? "Saving..." : "Save Assistant"}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* -------------------- KNOWLEDGE TAB -------------------- */}
      {activeTab === "knowledge" && (
        <div className="space-y-6 max-w-5xl">
          <section className="bg-gray-50 dark:bg-[#111217] p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-[#5d12ea]">
              Upload Knowledge Base Files
            </h2>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-16 text-center transition-all ${
                dragActive
                  ? "border-[#5d12ea] bg-[#5d12ea]/10"
                  : "border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-[#15171c] hover:border-gray-400 dark:hover:border-gray-600"
              }`}
            >
              <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Drag and drop files here</p>
              <p className="text-sm text-gray-500 mb-6">
                Supports: .txt, .pdf, .doc, .docx (Max 5MB)
              </p>
              <label className="inline-block bg-[#5d12ea] hover:bg-[#6d22fa] text-white font-medium px-8 py-3 rounded-lg cursor-pointer transition-all shadow-lg">
                Browse Files
                <input
                  type="file"
                  accept=".txt,.pdf,.doc,.docx"
                  multiple
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
            </div>
          </section>

          {knowledgeFiles.length > 0 && (
            <section className="bg-gray-50 dark:bg-[#111217] p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-[#5d12ea]">
                Uploaded Files ({knowledgeFiles.length})
              </h2>
              <div className="space-y-3">
                {knowledgeFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between bg-white dark:bg-[#15171c] rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-[#5d12ea]/20 p-3 rounded-lg">
                        <FileText className="w-6 h-6 text-[#5d12ea]" />
                      </div>
                      <div>
                        <p className="text-gray-900 dark:text-gray-200 font-medium">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {file.size} • {file.type}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(file.id)}
                      className="text-gray-400 hover:text-red-400 transition-colors p-2 hover:bg-red-400/10 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}