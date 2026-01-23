"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

// ✅ Updated: id is now a number (not string)
interface Assistant {
  id: number;
  name: string;
  role: string;
  status: string;
  promptType: string;
  predefinedPrompt?: string;
  customPrompt?: string;
  provider: string;
  model: string;
  apiKey?: string;
  createdAt: string;
  updatedAt: string;
}

interface AssistantContextType {
  assistants: Assistant[];
  loading: boolean;
  error: string | null;
  fetchAssistants: () => Promise<void>;
  addAssistant: (
    assistant: Omit<Assistant, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  deleteAssistant: (id: number) => Promise<void>; // ✅ updated to number
}

const AssistantContext = createContext<AssistantContextType | undefined>(undefined);

export const AssistantProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Fetch all assistants from API
  const fetchAssistants = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ai-assistant", { method: "GET" });
      if (!res.ok) throw new Error("Failed to fetch assistants");
      const data = await res.json();
      setAssistants(data);
    } catch (err: any) {
      console.error("Fetch Assistants Error:", err);
      setError(err.message || "Error fetching assistants");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Add new assistant to database via API
  const addAssistant = async (
    assistant: Omit<Assistant, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assistant),
      });
      if (!res.ok) throw new Error("Failed to add assistant");
      const newAssistant = await res.json();
      setAssistants((prev) => [...prev, newAssistant]);
    } catch (err: any) {
      console.error("Add Assistant Error:", err);
      setError(err.message || "Error adding assistant");
    }
  };

  // ✅ Delete assistant from database
  const deleteAssistant = async (id: number) => {
    try {
      const res = await fetch(`/api/ai-assistant/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete assistant");
      setAssistants((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      console.error("Delete Assistant Error:", err);
      setError(err.message || "Error deleting assistant");
    }
  };

  // Fetch assistants on load
  useEffect(() => {
    fetchAssistants();
  }, []);

  return (
    <AssistantContext.Provider
      value={{
        assistants,
        loading,
        error,
        fetchAssistants,
        addAssistant,
        deleteAssistant,
      }}
    >
      {children}
    </AssistantContext.Provider>
  );
};

// ✅ Custom hook to use the AssistantContext
export const useAssistantContext = () => {
  const context = useContext(AssistantContext);
  if (!context) {
    throw new Error(
      "useAssistantContext must be used within an AssistantProvider"
    );
  }
  return context;
};
