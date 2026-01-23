"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAssistantContext } from "@/context/AssistantContext";
import {
  Plus,
  Filter,
  Bot,
  Zap,
  Calendar,
  Edit,
  Trash2,
  Search,
} from "lucide-react";

export default function AIAssistantPage() {
  const router = useRouter();
  const { assistants, deleteAssistant } = useAssistantContext();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  // ✅ Delete Assistant (with confirmation)
  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this assistant?")) {
      try {
        await deleteAssistant(id);
      } catch (error) {
        console.error("Error deleting assistant:", error);
        alert("Failed to delete assistant. Please try again.");
      }
    }
  };

  // ✅ Edit Assistant
  const handleEdit = (id: number) => {
   router.push(`/ai-assistant/edit/${id}`);
  };

  // ✅ Create New Assistant
  const handleCreate = () => {
    router.push("/ai-assistant/new");
  };

  // ✅ Filter + Search
  const filteredAssistants = assistants.filter((assistant) => {
    const matchesSearch =
      assistant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assistant.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === "all" || assistant.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // ✅ Get unique roles dynamically
  const roles = ["all", ...new Set(assistants.map((a) => a.role))];

  // ✅ Status badge colors
  const getStatusColor = (status: string) =>
    status === "active"
      ? "bg-green-500/20 text-green-400 border-green-500/30"
      : "bg-gray-500/20 text-gray-400 border-gray-500/30";

  // ✅ Role badge colors
  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      "General Assistant": "bg-blue-500/20 text-blue-400 border-blue-500/30",
      "Customer Support Agent":
        "bg-purple-500/20 text-purple-400 border-purple-500/30",
      "Coding Assistant": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      "Sales Assistant": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    };
    return colors[role] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0b0c10] text-gray-900 dark:text-white p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">AI Assistants</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Manage and configure your custom AI assistants
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-[#5d12ea] hover:bg-[#6d22fa] text-white font-semibold px-6 py-3 rounded-lg transition-all shadow-lg hover:shadow-xl"
        >
          <Plus size={18} /> Create AI Assistant
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total Assistants */}
        <div className="bg-gray-50 dark:bg-[#111217] border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Assistants</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {assistants.length}
              </p>
            </div>
            <div className="bg-[#5d12ea]/20 p-3 rounded-lg">
              <Bot className="w-6 h-6 text-[#5d12ea]" />
            </div>
          </div>
        </div>

        {/* Active Assistants */}
        <div className="bg-gray-50 dark:bg-[#111217] border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Active Assistants</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {assistants.filter((a) => a.status === "active").length}
              </p>
            </div>
            <div className="bg-green-500/20 p-3 rounded-lg">
              <Zap className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        {/* Recently Created */}
        <div className="bg-gray-50 dark:bg-[#111217] border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Recently Created</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {
                  assistants.filter((a) => {
                    const daysDiff = Math.floor(
                      (Date.now() - new Date(a.createdAt).getTime()) /
                        (1000 * 60 * 60 * 24)
                    );
                    return daysDiff <= 7;
                  }).length
                }
              </p>
            </div>
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
     <div className="flex-1 relative">
  {/* Always-visible icon (Google-style). pointer-events-none so clicks focus the input */}
  <Search
    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
    aria-hidden="true"
  />

  <input
    type="text"
    placeholder="Search assistants by name or role..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    /* Force left padding so placeholder & typed text never collide with the icon */
    style={{ paddingLeft: "3.2rem" }}
    className="w-full bg-gray-50 dark:bg-[#111217] border border-gray-200 dark:border-gray-800 rounded-lg pr-4 py-3 text-gray-900 dark:text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#5d12ea] transition-colors"
  />
</div>

<div className="relative min-w-[200px]">
  <Filter className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

  <select
    value={filterRole}
    onChange={(e) => setFilterRole(e.target.value)}
    style={{ paddingLeft: "3.75rem" }}   // 🔥 FORCE FIX
    className="
      w-full
      bg-gray-50 dark:bg-[#111217]
      border border-gray-200 dark:border-gray-800
      rounded-lg
      pr-4 py-3
      text-gray-900 dark:text-gray-200
      appearance-none
      focus:outline-none focus:border-[#5d12ea]
      transition-colors
      cursor-pointer
    "
  >
    {roles.map((role) => (
      <option key={role} value={role}>
        {role === "all" ? "All Roles" : role}
      </option>
    ))}
  </select>
</div>


       
      </div>

      {/* Assistants Table */}
      <div className="bg-gray-50 dark:bg-[#111217] border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-100 dark:bg-[#15171c] border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="py-4 px-6 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Assistant
                </th>
                <th className="py-4 px-6 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Role
                </th>
                <th className="py-4 px-6 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Model
                </th>
                <th className="py-4 px-6 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Provider
                </th>
                <th className="py-4 px-6 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </th>
                <th className="py-4 px-6 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Created
                </th>
                <th className="py-4 px-6 text-sm font-medium text-gray-700 dark:text-gray-300 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAssistants.map((assistant) => (
                <tr
                  key={assistant.id}
                  className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-[#1a1b1f] transition-all"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-[#5d12ea]/20 p-2 rounded-lg">
                        <Bot className="w-5 h-5 text-[#5d12ea]" />
                      </div>
                      <span className="text-gray-900 dark:text-gray-200 font-medium">
                        {assistant.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${getRoleBadgeColor(
                        assistant.role
                      )}`}
                    >
                      {assistant.role}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-800 dark:text-gray-300 font-medium">
                    {assistant.model}
                  </td>
                  <td className="py-4 px-6 text-gray-600 dark:text-gray-400">
                    {assistant.provider}
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${getStatusColor(
                        assistant.status
                      )}`}
                    >
                      {assistant.status.charAt(0).toUpperCase() +
                        assistant.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-600 dark:text-gray-400 text-sm">
                    {new Date(assistant.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(assistant.id)}
                        className="flex items-center gap-1.5 bg-gray-200 dark:bg-[#22242a] hover:bg-gray-300 dark:hover:bg-[#2c2e35] text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                      >
                        <Edit size={15} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(assistant.id)}
                        className="flex items-center gap-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                      >
                        <Trash2 size={15} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredAssistants.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-gray-200 dark:bg-[#15171c] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-gray-700 dark:text-gray-400 text-lg mb-2">No assistants found</p>
            <p className="text-gray-500 text-sm">
              {searchQuery || filterRole !== "all"
                ? "Try adjusting your search or filters"
                : "Create your first assistant to get started"}
            </p>
          </div>
        )}
      </div>

      {/* Results Count */}
      {filteredAssistants.length > 0 && (
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredAssistants.length} of {assistants.length} assistants
        </div>
      )}
    </div>
  );
}