"use client";

import { useEffect, useState } from "react";
import { PlusCircle, Eye, Edit, Trash } from "lucide-react";
import Link from "next/link";

interface Flow {
  id: number;
  businessId: string;
  name: string;
  flowId: string;
  categories: string;
  status: string;
  validation: string;
}

export default function WhatsappFlowsPage() {
  const [selectedBusiness, setSelectedBusiness] = useState("1703864723671954");
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFlows = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/whatsapp-flows/list");
      const data = await res.json();
      setFlows(data);
    } catch (error) {
      console.error("Failed to fetch flows:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlows();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this flow?")) return;
    try {
      const res = await fetch(`/api/whatsapp-flows/delete/${id}`, { method: "DELETE" });
      if (res.ok) {
        setFlows(flows.filter((flow) => flow.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete flow:", error);
    }
  };

  const handleCreateForm = async () => {
    // Example: Create a dummy flow (replace with modal/form in production)
    try {
      const res = await fetch("/api/whatsapp-flows/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: selectedBusiness,
          name: "New Flow",
          flowId: Math.random().toString(36).substring(2, 10),
          categories: "General",
          status: "Active",
          validation: "None",
        }),
      });
      if (res.ok) fetchFlows();
    } catch (error) {
      console.error("Failed to create flow:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <style>{`.dark .flows-header { color: #1e40af !important; }`}</style>
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">WhatsApp Forms</h1>
            <p className="text-gray-500 text-sm mt-1">
              Select a WhatsApp Business Account to manage its forms
            </p> 
          </div>

          <select
            value={selectedBusiness}
            onChange={(e) => setSelectedBusiness(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
          >
            <option value="1703864723671954">1703864723671954</option>
            <option value="690450277478223">690450277478223</option>
          </select>

          <button className="mt-2 md:mt-0 flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg shadow hover:bg-green-700 transition-all">
  <PlusCircle className="w-4 h-4" />
  <Link href="/manage/whatsapp-flows/create">Create Form</Link>
</button>
        </div>
   <div className="overflow-x-auto">
  <table className="min-w-full border border-gray-200 text-sm text-gray-700 rounded-lg overflow-hidden">
    <thead className="bg-blue-50 !dark:bg-black text-blue-800 !dark:text-blue-900 uppercase text-xs flows-header">
      <tr className="flows-header-row">
        <th className="px-6 py-3 text-left">Name</th>
        <th className="px-6 py-3 text-left">Flow ID</th>
        <th className="px-6 py-3 text-left">Categories</th>
        <th className="px-6 py-3 text-left">Status</th>
        <th className="px-6 py-3 text-left">Validation</th>
        <th className="px-6 py-3 text-center">Actions</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-200">
      {loading ? (
        <tr>
          <td colSpan={6} className="text-center py-8">
            Loading...
          </td>
        </tr>
      ) : flows.length === 0 ? (
        <tr>
          <td colSpan={6} className="text-center py-8 text-gray-500 font-medium">
            No results.
          </td>
        </tr>
      ) : (
        flows.map((flow) => (
          <tr key={flow.id} className="hover:bg-gray-50 transition whatsapp-row">
            <td className="px-6 py-4">{flow.name}</td>
            <td className="px-6 py-4">{flow.flowId}</td>
            <td className="px-6 py-4">{flow.categories}</td>
            <td className="px-6 py-4">{flow.status}</td>
            <td className="px-6 py-4">
              {(() => {
                try {
                  const validationObj = JSON.parse(flow.validation);
                  return `${validationObj.screenTitle || ""} | ${
                    validationObj.largeHeading || ""
                  } | ${validationObj.fields?.length || 0} fields`;
                } catch (e) {
                  return flow.validation; // fallback in case it's not valid JSON
                }
              })()}
            </td>
            <td className="px-6 py-4 text-center">
  <div className="inline-flex items-center gap-2">
    {/* View */}
    <button className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm shadow transition">
      <Eye className="w-4 h-4" />
      View
    </button>

    {/* Edit */}
    <button className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm shadow transition">
      <Edit className="w-4 h-4" />
      Edit
    </button>

    {/* Delete */}
    <button
      onClick={() => handleDelete(flow.id)}
      className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm shadow transition"
    >
      <Trash className="w-4 h-4" />
      Delete
    </button>
  </div>
</td>

          </tr>
        ))
      )}
    </tbody>
  </table>
</div>

      
      </div>
    </div>
  );
}
