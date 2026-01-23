"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Plus,
  BarChart3,
  Search,
  Check,
  Megaphone,
  AlertCircle,
  ChevronDown
} from "lucide-react";
import { toast } from "react-hot-toast";
import { EditCampaignForm } from "@/components/EditCampaignForm";

type Campaign = {
  id: string;
  name: string;
  type: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  leadsCount: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  description?: string | null;
};

type SortField = "name" | "type" | "status" | "startDate" | "leadsCount" | "sentCount" | "deliveredCount" | "failedCount";
type SortOrder = "asc" | "desc";

const FIELD_MAP: Record<SortField, string> = {
  name: "Campaign Name",
  type: "Type",
  status: "Status",
  startDate: "Start Date",
  leadsCount: "Leads",
  sentCount: "Sent",
  deliveredCount: "Delivered",
  failedCount: "Failed",
};

// STATUS BADGES (consistent with Template page)
const getStatusClasses = (status: string) => {
  const s = status.toLowerCase();
  switch (s) {
    case "active":
    case "processing":
      return `px-3 py-1 text-[10px] font-bold rounded-full border shadow-sm bg-blue-50 text-blue-700 border-blue-200`;
    case "completed":
    case "finished":
      return `px-3 py-1 text-[10px] font-bold rounded-full border shadow-sm bg-green-50 text-green-700 border-green-200`;
    case "paused":
      return `px-3 py-1 text-[10px] font-bold rounded-full border shadow-sm bg-yellow-50 text-yellow-700 border-yellow-200`;
    case "failed":
    case "rejected":
      return `px-3 py-1 text-[10px] font-bold rounded-full border shadow-sm bg-red-50 text-red-700 border-red-200`;
    default:
      return `px-3 py-1 text-[10px] font-bold rounded-full border shadow-sm bg-gray-50 text-gray-700 border-gray-200`;
  }
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [viewMode, setViewMode] = useState<"view" | "edit" | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<SortField>("startDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    "name",
    "type",
    "status",
    "startDate",
    "leadsCount",
    "sentCount",
    "failedCount",
  ]);
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const statusParam = statusFilter === "ALL" ? "" : `&status=${statusFilter.toLowerCase()}`;
      // NOTE: CORRECT ENDPOINT IS /campaigns/api
      const res = await fetch(
        `/campaigns/api?search=${search}&page=${page}&pageSize=${pageSize}&sort=${sortField}:${sortOrder}${statusParam}`
      );
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.items || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error(err);
      setCampaigns([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [search, page, pageSize, sortField, sortOrder, statusFilter]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Handle outside click for column dropdown
  useEffect(() => {
    function handleClickOutside(event: globalThis.MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest(".columns-dropdown")) {
        setShowColumnDropdown(false);
      }
    }
    if (showColumnDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showColumnDropdown]);

  async function deleteCampaign(id: string) {
    if (!confirm("Delete this campaign permanently?")) return;
    try {
      const res = await fetch(`/campaigns/api?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Campaign deleted");
        fetchCampaigns();
      } else {
        toast.error("Failed to delete campaign");
      }
    } catch (e) {
      toast.error("Error deleting campaign");
    }
  }

  async function updateCampaign(updated: Partial<Campaign>) {
    if (!selected) return;
    try {
      const res = await fetch(`/campaigns/api?id=${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        toast.success("Campaign updated");
        setViewMode(null);
        setSelected(null);
        fetchCampaigns();
      } else {
        toast.error("Failed to update campaign");
      }
    } catch (e) {
      toast.error("Error updating campaign");
    }
  }

  const totalPages = useMemo(() => Math.ceil(total / pageSize), [total, pageSize]);
  const currentPageStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const currentPageEnd = Math.min(page * pageSize, total);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8 overflow-x-hidden">
      <div className="w-full max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
            <p className="text-gray-500 mt-1">
              Manage and launch your marketing campaigns
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.href = '/campaigns/create'}
              className="flex items-center gap-2 bg-blue-600 text-white font-medium px-5 py-2.5 rounded-xl shadow hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
              New Campaign
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 border rounded-xl bg-white shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{total}</div>
              <div className="text-sm text-gray-500">Total Campaigns</div>
            </div>
          </div>
          <div className="p-5 border rounded-xl bg-white shadow-sm flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-lg text-green-600">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {campaigns.filter(c => c.status.toLowerCase() === 'completed').length}
              </div>
              <div className="text-sm text-gray-500">Completed</div>
            </div>
          </div>
          <div className="p-5 border rounded-xl bg-white shadow-sm flex items-center gap-4">
            <div className="p-3 bg-orange-50 rounded-lg text-orange-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {campaigns.filter(c => c.status.toLowerCase() === 'failed').length}
              </div>
              <div className="text-sm text-gray-500">Failed</div>
            </div>
          </div>
        </div>

        {/* Filters & Column Selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-2 bg-white p-2 rounded-xl border shadow-sm w-full max-w-md">
            <Search className="w-5 h-5 text-gray-400 ml-2" />
            <input
              type="text"
              placeholder="Search campaigns..."
              className="w-full text-sm outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Column Selector Dropdown */}
            <div className="relative columns-dropdown">
              <button
                onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold uppercase shadow-sm hover:bg-gray-50 transition"
              >
                <Filter className="w-3 h-3 text-blue-600" />
                Columns
                <ChevronDown className="w-3 h-3 ml-1" />
              </button>
              {showColumnDropdown && (
                <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 w-48 overflow-hidden">
                  <div className="p-2 flex flex-col gap-1">
                    {Object.entries(FIELD_MAP).map(([field, label]) => (
                      <label key={field} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer transition">
                        <input
                          type="checkbox"
                          checked={visibleColumns.includes(field)}
                          onChange={() =>
                            setVisibleColumns((prev) =>
                              prev.includes(field)
                                ? prev.filter((f) => f !== field)
                                : [...prev, field]
                            )
                          }
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs font-bold text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Status Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-xl border shadow-sm">
              {(["ALL", "ACTIVE", "COMPLETED", "SCHEDULED"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${statusFilter === filter
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  {filter.charAt(0) + filter.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto text-sm text-left">
              <thead className="bg-gray-50 border-b sticky top-0 z-10">
                <tr className="text-gray-600 font-medium uppercase text-[10px] tracking-wider">
                  {Object.entries(FIELD_MAP).map(([field, displayName]) => {
                    if (!visibleColumns.includes(field)) return null;
                    return (
                      <th
                        key={field}
                        className="py-4 px-6 cursor-pointer hover:bg-gray-100 transition"
                        onClick={() => toggleSort(field as SortField)}
                      >
                        <div className="flex items-center gap-1">
                          {displayName}
                          {sortField === field && (sortOrder === "asc" ? "↑" : "↓")}
                        </div>
                      </th>
                    );
                  })}
                  <th className="py-4 px-6 text-right font-medium text-gray-600 uppercase text-[10px] tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumns.length + 1} className="py-8 text-center text-gray-500">Loading campaigns...</td>
                  </tr>
                ) : campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumns.length + 1} className="py-12 text-center text-gray-500 text-sm">No campaigns found</td>
                  </tr>
                ) : (
                  campaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors border-b last:border-0 group">
                      {visibleColumns.includes("name") && (
                        <td className="py-4 px-6">
                          <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition truncate max-w-[200px]" title={c.name}>
                            {c.name}
                          </div>
                        </td>
                      )}
                      {visibleColumns.includes("type") && <td className="py-4 px-6 text-gray-600">{c.type}</td>}
                      {visibleColumns.includes("status") && (
                        <td className="py-4 px-6">
                          <span className={getStatusClasses(c.status)}>
                            {c.status}
                          </span>
                        </td>
                      )}
                      {visibleColumns.includes("startDate") && (
                        <td className="py-4 px-6 text-gray-600">
                          {c.startDate ? new Date(c.startDate).toLocaleDateString() : "-"}
                        </td>
                      )}
                      {visibleColumns.includes("leadsCount") && <td className="py-4 px-6 font-medium">{c.leadsCount}</td>}
                      {visibleColumns.includes("sentCount") && <td className="py-4 px-6 text-blue-600 font-medium">{c.sentCount}</td>}
                      {visibleColumns.includes("deliveredCount") && <td className="py-4 px-6 text-green-600 font-medium">{c.deliveredCount}</td>}
                      {visibleColumns.includes("failedCount") && <td className="py-4 px-6 text-red-500 font-medium">{c.failedCount}</td>}

                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelected(c);
                              setViewMode("view");
                            }}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => window.location.href = `/campaigns/${c.id}/stats`}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="View Stats"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelected(c);
                              setViewMode("edit");
                            }}
                            className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteCampaign(c.id)}
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

        {/* Pagination bar */}
        <div className="flex items-center justify-between text-sm text-gray-500 pb-8">
          <div>
            Showing <strong>{currentPageStart}</strong>–<strong>{currentPageEnd}</strong> of <strong>{total}</strong>
          </div>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-4 py-2 border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 transition shadow-sm"
            >
              Prev
            </button>
            <button
              disabled={page === totalPages || total === 0}
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 transition shadow-sm"
            >
              Next
            </button>
          </div>
        </div>

        {/* Backdrop Modal for View/Edit */}
        {selected && viewMode && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button
                className="text-gray-400 hover:text-red-500 absolute top-4 right-4 transition-colors"
                onClick={() => {
                  setSelected(null);
                  setViewMode(null);
                }}
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>

              {viewMode === "view" ? (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 border-b pb-4">Campaign Details</h2>
                  <div className="space-y-4">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-gray-500">Name:</span>
                      <span className="font-semibold">{selected.name}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-gray-500">Type:</span>
                      <span className="font-semibold">{selected.type}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-gray-500">Status:</span>
                      <span className={getStatusClasses(selected.status)}>{selected.status}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-gray-500">Start Date:</span>
                      <span className="font-semibold">{selected.startDate ? new Date(selected.startDate).toLocaleDateString() : "-"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-500">Leads</div>
                        <div className="text-lg font-bold">{selected.leadsCount}</div>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-xs text-gray-500 text-blue-600">Sent</div>
                        <div className="text-lg font-bold text-blue-700">{selected.sentCount}</div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-xs text-gray-500 text-green-600">Delivered</div>
                        <div className="text-lg font-bold text-green-700">{selected.deliveredCount}</div>
                      </div>
                      <div className="p-3 bg-red-50 rounded-lg">
                        <div className="text-xs text-gray-500 text-red-600">Failed</div>
                        <div className="text-lg font-bold text-red-700">{selected.failedCount}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Description:</div>
                      <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">{selected.description || "No description provided."}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <EditCampaignForm
                  campaign={selected}
                  onSave={updateCampaign}
                  onCancel={() => {
                    setSelected(null);
                    setViewMode(null);
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
