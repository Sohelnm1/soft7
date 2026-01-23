"use client";

import { useState, useEffect } from "react";
import {
  Copy,
  Check,
  Plus,
  Eye,
  Menu,
  RefreshCw,
  Phone,
  ShieldCheck,
  FileText,
  Search,
  Trash2
} from "lucide-react";
import { toast } from "react-hot-toast";

interface Template {
  id: number;
  name: string;
  category: string;
  language: string;
  status: string;
  whatsappAccount: {
    phoneNumber: string;
    wabaId: string;
  };
}

export default function WhatsappTemplatesPage() {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Filter & Sort State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "APPROVED" | "PENDING">("ALL");
  const [sortField, setSortField] = useState<keyof Template | "phoneNumber">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/templates/list");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error("Failed to fetch templates", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/templates/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        alert("Templates synced successfully!");
        fetchTemplates();
      } else {
        alert("Failed to sync: " + data.error);
      }
    } catch (error) {
      alert("An error occurred during sync.");
    } finally {
      setSyncing(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    if (navigator?.clipboard) navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const toggleSort = (field: keyof Template | "phoneNumber") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const filteredAndSortedTemplates = templates
    .filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.language.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "APPROVED" && t.status === "APPROVED") ||
        (statusFilter === "PENDING" && t.status !== "APPROVED");

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let valA: any = sortField === "phoneNumber" ? a.whatsappAccount.phoneNumber : a[sortField as keyof Template];
      let valB: any = sortField === "phoneNumber" ? b.whatsappAccount.phoneNumber : b[sortField as keyof Template];

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8 overflow-x-hidden">
      <div className="w-full max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">WhatsApp Templates</h1>
            <p className="text-gray-500 mt-1">
              Manage your message templates and sync with Meta
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 bg-white text-gray-700 font-medium px-4 py-2.5 rounded-xl shadow-sm border hover:bg-gray-50 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? "Syncing..." : "Sync from Meta"}
            </button>
            <button
              onClick={() => window.location.href = '/manage/templates/create'}
              className="flex items-center gap-2 bg-blue-600 text-white font-medium px-5 py-2.5 rounded-xl shadow hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
              New Template
            </button>
          </div>
        </div>

        {/* Stats / Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 border rounded-xl bg-white shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{templates.length}</div>
              <div className="text-sm text-gray-500">Total Templates</div>
            </div>
          </div>
          <div className="p-5 border rounded-xl bg-white shadow-sm flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-lg text-green-600">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {templates.filter(t => t.status === 'APPROVED').length}
              </div>
              <div className="text-sm text-gray-500">Approved</div>
            </div>
          </div>
          <div className="p-5 border rounded-xl bg-white shadow-sm flex items-center gap-4">
            <div className="p-3 bg-orange-50 rounded-lg text-orange-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {templates.filter(t => t.status !== 'APPROVED').length}
              </div>
              <div className="text-sm text-gray-500">Pending/Rejected</div>
            </div>
          </div>
        </div>


        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-white p-2 rounded-xl border shadow-sm w-full max-w-md">
            <Search className="w-5 h-5 text-gray-400 ml-2" />
            <input
              type="text"
              placeholder="Search by name, category, or language..."
              className="w-full text-sm outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex bg-gray-100 p-1 rounded-xl border shadow-sm">
            {(["ALL", "APPROVED", "PENDING"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${statusFilter === filter
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                {filter === "ALL" ? "All" : filter === "APPROVED" ? "Approved" : "Pending/Other"}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Table */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto text-sm text-left">
              <thead className="bg-gray-50 border-b sticky top-0 z-10">
                <tr className="text-gray-600 font-medium uppercase text-[10px] tracking-wider">
                  <th className="py-4 px-6 cursor-pointer hover:bg-gray-100 transition" onClick={() => toggleSort("name")}>
                    <div className="flex items-center gap-1">
                      Name
                      {sortField === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                    </div>
                  </th>
                  <th className="py-4 px-6 cursor-pointer hover:bg-gray-100 transition" onClick={() => toggleSort("category")}>
                    <div className="flex items-center gap-1">
                      Category
                      {sortField === "category" && (sortOrder === "asc" ? "↑" : "↓")}
                    </div>
                  </th>
                  <th className="py-4 px-6 cursor-pointer hover:bg-gray-100 transition" onClick={() => toggleSort("language")}>
                    <div className="flex items-center gap-1">
                      Language
                      {sortField === "language" && (sortOrder === "asc" ? "↑" : "↓")}
                    </div>
                  </th>
                  <th className="py-4 px-6 cursor-pointer hover:bg-gray-100 transition" onClick={() => toggleSort("status")}>
                    <div className="flex items-center gap-1">
                      Status
                      {sortField === "status" && (sortOrder === "asc" ? "↑" : "↓")}
                    </div>
                  </th>
                  <th className="py-4 px-6 cursor-pointer hover:bg-gray-100 transition" onClick={() => toggleSort("phoneNumber")}>
                    <div className="flex items-center gap-1">
                      Account
                      {sortField === "phoneNumber" && (sortOrder === "asc" ? "↑" : "↓")}
                    </div>
                  </th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">Loading templates...</td>
                  </tr>
                ) : filteredAndSortedTemplates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <div className="bg-gray-50 p-4 rounded-full">
                          <Search className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="font-medium text-gray-600">No matching templates found</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                        <button
                          onClick={() => { setSearchQuery(""); setStatusFilter("ALL"); }}
                          className="text-blue-600 text-sm font-semibold mt-2 hover:underline"
                        >
                          Clear all filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedTemplates.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors border-b last:border-0 group">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition truncate max-w-[200px]" title={t.name}>
                          {t.name}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {t.category}
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        <span className="uppercase text-xs font-semibold bg-gray-100 px-2 py-1 rounded">
                          {t.language}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 text-[10px] font-bold rounded-full border shadow-sm ${t.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' :
                          t.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-yellow-50 text-yellow-700 border-yellow-200'
                          }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-500 text-xs">
                        <div className="flex flex-col">
                          <span>{t.whatsappAccount.phoneNumber}</span>
                          <span className="opacity-70">{t.whatsappAccount.wabaId}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setPreviewTemplate(t);
                              setShowPreviewModal(true);
                            }}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors group/btn"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => window.location.href = `/manage/templates/${t.id}`}
                            className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm("Are you sure you want to delete this template?")) return;
                              try {
                                const res = await fetch(`/api/templates/${t.id}`, { method: 'DELETE' });
                                if (res.ok) {
                                  toast.success("Template deleted");
                                  fetchTemplates();
                                } else {
                                  toast.error("Failed to delete");
                                }
                              } catch (e) {
                                toast.error("Error deleting template");
                              }
                            }}
                            className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Preview Modal */}
      {showPreviewModal && previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowPreviewModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Template Preview</h2>
              <button onClick={() => setShowPreviewModal(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="bg-gradient-to-b from-teal-500 to-teal-600 rounded-3xl p-4 shadow-xl">
                <div className="rounded-2xl p-4 min-h-[400px] relative overflow-hidden" style={{
                  backgroundColor: '#e5ddd5',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d9d9d9' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}>
                  <div className="bg-white rounded-lg shadow-md p-3 max-w-[280px] relative z-10">
                    {previewTemplate.components?.find((c: any) => c.type === 'HEADER') && (
                      <div className="mb-2">
                        {(() => {
                          const header = previewTemplate.components.find((c: any) => c.type === 'HEADER');
                          if (header.format === 'TEXT') {
                            return <div className="font-semibold text-sm">{header.text}</div>;
                          }
                          if (header.format === 'IMAGE') {
                            // Access the image URL from the correct path
                            const imageUrl = header.example?.header_handle?.[0];
                            return imageUrl ? (
                              <img src={imageUrl} alt="Header" className="w-full h-40 object-cover rounded" onError={(e) => {
                                e.currentTarget.src = '';
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }} />
                            ) : (
                              <div className="bg-gray-200 h-32 rounded flex items-center justify-center text-gray-500 text-xs">
                                <div className="text-center">
                                  <svg className="w-8 h-8 mx-auto mb-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                  </svg>
                                  Image
                                </div>
                              </div>
                            );
                          }
                          if (header.format === 'VIDEO') {
                            const videoUrl = header.example?.header_handle?.[0] || header.example?.header_url?.[0];
                            return videoUrl ? (
                              <video src={videoUrl} className="w-full h-32 object-cover rounded" controls />
                            ) : (
                              <div className="bg-gray-200 h-32 rounded flex items-center justify-center text-gray-500 text-xs">
                                <div className="text-center">
                                  <svg className="w-8 h-8 mx-auto mb-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                  </svg>
                                  Video
                                </div>
                              </div>
                            );
                          }
                          if (header.format === 'DOCUMENT') {
                            const docUrl = header.example?.header_handle?.[0] || header.example?.header_url?.[0];
                            const fileName = docUrl ? docUrl.split('/').pop() : 'Document';
                            return (
                              <div className="bg-gray-100 p-3 rounded flex items-center gap-2 text-xs">
                                <FileText className="w-5 h-5 text-gray-600" />
                                <span className="flex-1 truncate">{fileName}</span>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    )}
                    {previewTemplate.components?.find((c: any) => c.type === 'BODY') && (
                      <div className="text-sm mb-2 whitespace-pre-wrap">
                        {previewTemplate.components.find((c: any) => c.type === 'BODY').text}
                      </div>
                    )}
                    {previewTemplate.components?.find((c: any) => c.type === 'FOOTER') && (
                      <div className="text-xs text-gray-500 mb-2">
                        {previewTemplate.components.find((c: any) => c.type === 'FOOTER').text}
                      </div>
                    )}
                    {previewTemplate.components?.find((c: any) => c.type === 'BUTTONS') && (
                      <div className="space-y-1 mt-3 pt-2 border-t border-gray-200">
                        {previewTemplate.components.find((c: any) => c.type === 'BUTTONS').buttons?.map((btn: any, idx: number) => (
                          <button key={idx} className="w-full text-center text-blue-600 font-medium text-sm py-2.5 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                            {btn.type === 'URL' && '🔗 '}
                            {btn.type === 'PHONE_NUMBER' && '📞 '}
                            {btn.text}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-center text-xs text-gray-600 mt-4">
                    {previewTemplate.name} • {previewTemplate.language}
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div><span className="font-semibold">Status:</span> <span className={`px-2 py-1 rounded text-xs ${previewTemplate.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{previewTemplate.status}</span></div>
                <div><span className="font-semibold">Category:</span> {previewTemplate.category}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}