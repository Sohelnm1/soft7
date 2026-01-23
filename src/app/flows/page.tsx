'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  MoreHorizontal,
  Clock,
  ChevronDown,
  CheckCircle2,
  Circle,
  Trash2,
  Copy,
  Edit3,
  PlayCircle,
  PauseCircle,
  Filter,
  Loader2,
} from 'lucide-react';

type FlowStatus = 'Active' | 'Inactive';

interface Flow {
  id: number;
  name: string;
  status: FlowStatus;
  createdAt: string;
  updatedAt: string;
}

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date(date));

export default function FlowsManagement() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const router = useRouter();

  const [flows, setFlows] = useState<Flow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch flows from API
  useEffect(() => {
    fetchFlows();
  }, []);

  const fetchFlows = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/flows');
      if (!response.ok) throw new Error('Failed to fetch flows');
      
      const data = await response.json();
      setFlows(data);
    } catch (error) {
      console.error('Error fetching flows:', error);
      alert('Failed to load flows');
    } finally {
      setIsLoading(false);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
      
      if (openMenuId !== null) {
        const target = event.target as HTMLElement;
        const isClickInsideMenu = target.closest(`[data-menu-id="${openMenuId}"]`);
        if (!isClickInsideMenu) {
          setOpenMenuId(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  const tabCounts = useMemo(() => {
    const active = flows.filter((f) => f.status === 'Active').length;
    const inactive = flows.length - active;
    return { active, inactive, all: flows.length };
  }, [flows]);

  const visibleFlows = useMemo(() => {
    let list = [...flows];

    if (activeTab === 'active') {
      list = list.filter((f) => f.status === 'Active');
    } else if (activeTab === 'inactive') {
      list = list.filter((f) => f.status === 'Inactive');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((f) => f.name.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return sortBy === 'oldest' ? aTime - bTime : bTime - aTime;
    });

    return list;
  }, [flows, activeTab, searchQuery, sortBy]);

  const toggleStatus = async (id: number) => {
    const flow = flows.find((f) => f.id === id);
    if (!flow) return;

    const newStatus = flow.status === 'Active' ? 'Inactive' : 'Active';

    try {
      const response = await fetch(`/api/flows/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      setFlows((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, status: newStatus, updatedAt: new Date().toISOString() } : f
        )
      );
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update flow status');
    }
    
    setOpenMenuId(null);
  };

  const deleteFlow = async (id: number) => {
    const flow = flows.find((f) => f.id === id);
    if (flow && !confirm(`Delete flow "${flow.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/flows/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete flow');

      setFlows((prev) => prev.filter((f) => f.id !== id));
    } catch (error) {
      console.error('Error deleting flow:', error);
      alert('Failed to delete flow');
    }
    
    setOpenMenuId(null);
  };

  const duplicateFlow = async (id: number) => {
    const flow = flows.find((f) => f.id === id);
    if (!flow) return;

    try {
      const response = await fetch('/api/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${flow.name} (Copy)`,
          status: 'Inactive',
        }),
      });

      if (!response.ok) throw new Error('Failed to duplicate flow');

      const newFlow = await response.json();
      setFlows((prev) => [newFlow, ...prev]);
    } catch (error) {
      console.error('Error duplicating flow:', error);
      alert('Failed to duplicate flow');
    }
    
    setOpenMenuId(null);
  };

  const handleEdit = (id: number) => {
    router.push(`/flows/edit/${id}`);
  };

  const handleCreateNew = () => {
    router.push('/flows/create');
  };

  const handleOpenFlowBuilder = (id: number) => {
    router.push(`/flows/builder/${id}`);
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#050816]' : 'bg-gray-50'}`}>
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-emerald-500" />
          <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>Loading flows...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDark ? 'bg-[#050816] text-white' : 'bg-gray-50 text-gray-900'
      }`}
    >
      {/* Header */}
      <div
        className={`border-b px-8 py-6 ${
          isDark ? 'border-slate-800/60' : 'border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between max-w-[1800px] mx-auto">
          <div>
            <h1 className="text-3xl font-bold mb-2 tracking-tight">Flows</h1>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
              Create and manage your automation workflows
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCreateNew}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/45 text-sm font-medium"
            >
              <Plus size={18} strokeWidth={2.4} />
              New Flow
            </button>
          </div>
        </div>
      </div>

      {/* Tabs + Search + Sort */}
      <div className={`border-b px-8 ${isDark ? 'border-slate-800/60' : 'border-gray-200'}`}>
        <div className="max-w-[1800px] mx-auto flex items-center justify-between h-14 gap-4">
          {/* Tabs */}
          <div className="flex gap-4">
            {([
              { key: 'all', label: 'All' },
              { key: 'active', label: 'Active' },
              { key: 'inactive', label: 'Inactive' },
            ] as const).map((tab) => {
              const count = tabCounts[tab.key];
              const selected = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative pb-2.5 text-sm font-medium transition-all flex items-center gap-1.5 ${
                    selected
                      ? 'text-emerald-500'
                      : isDark
                      ? 'text-slate-400 hover:text-slate-300'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                  <span
                    className={`text-[11px] px-1.5 py-0.5 rounded-full border ${
                      selected
                        ? 'border-emerald-500'
                        : isDark
                        ? 'border-slate-700 text-slate-400'
                        : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    {count}
                  </span>
                  {selected && (
                    <span className="absolute left-0 bottom-0 h-[2px] w-full rounded-full bg-emerald-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-3">
          <div className="relative w-80">
  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />

  <input
    type="text"
    placeholder="Search flows..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    style={{ paddingLeft: "3.75rem" }}   // 👈 INLINE WINS OVER !important
    className="
      w-full h-11
      rounded-lg
      pr-4
      border
      outline-none
      text-sm
      bg-white dark:bg-slate-900/40
      border-gray-200 dark:border-slate-700
      text-gray-900 dark:text-white
      placeholder-gray-400 dark:placeholder-slate-500
      focus:ring-2 focus:ring-emerald-500
    "
  />
</div>


 
            {/* Sort dropdown */}
            <div className="relative" ref={sortDropdownRef}>
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border text-[13px] ${
                  isDark
                    ? 'border-slate-700 bg-slate-900/40 text-slate-300'
                    : 'border-gray-200 bg-white text-gray-700'
                }`}
              >
                <Clock size={15} />
                {sortBy === 'newest' ? 'Newest' : sortBy === 'oldest' ? 'Oldest' : 'Name A–Z'}
                <ChevronDown size={14} />
              </button>

              {showSortDropdown && (
                <div
                  className={`absolute right-0 mt-1 w-40 rounded-lg border text-xs shadow-lg overflow-hidden
 z-20 ${
                    isDark ? 'bg-[#050816] border-slate-800' : 'bg-white border-gray-200'
                  }`}
                >
                  {[
                    { key: 'newest', label: 'Newest first' },
                    { key: 'oldest', label: 'Oldest first' },
                    { key: 'name', label: 'Name A–Z' },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => {
                        setSortBy(opt.key as 'newest' | 'oldest' | 'name');
                        setShowSortDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-emerald-500/10 ${
                        sortBy === opt.key ? 'font-medium text-emerald-500' : ''
                      }`}
                    >
                      {opt.label}
                      {sortBy === opt.key && <CheckCircle2 size={13} className="shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="px-8 py-6">
        <div
          className={`max-w-[1800px] mx-auto rounded-2xl overflow-visible border shadow-sm ${
            isDark ? 'border-slate-800/60 bg-[#050816]' : 'border-gray-200 bg-white'
          }`}
        >
          {visibleFlows.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                  isDark ? 'bg-slate-800/70' : 'bg-gray-100'
                }`}
              >
                <PlayCircle size={26} className={isDark ? 'text-slate-300' : 'text-gray-500'} />
              </div>
              <h3 className="text-lg font-semibold mb-1">No flows found</h3>
              <p className={`text-sm mb-4 max-w-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                Get started by creating your first automation flow
              </p>
              <button
                onClick={handleCreateNew}
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 shadow-md shadow-emerald-500/30"
              >
                <Plus size={16} />
                Create Flow
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr
                  className={`text-left text-xs uppercase tracking-wider ${
                    isDark ? 'text-slate-500' : 'text-gray-500'
                  }`}
                >
                  <th className="pb-4 pt-4 font-semibold pl-6">Name</th>
                  <th className="pb-4 pt-4 font-semibold">Status</th>
                  <th className="pb-4 pt-4 font-semibold">Created</th>
                  <th className="pb-4 pt-4 font-semibold">Last Updated</th>
                  <th className="pb-4 pt-4 font-semibold pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleFlows.map((flow) => (
                  <tr
                    key={flow.id}
                    className={`group text-sm border-t ${
                      isDark
                        ? 'border-slate-800/60 hover:bg-slate-900/40'
                        : 'border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <td
                      onClick={() => handleOpenFlowBuilder(flow.id)}
                      className="py-4 pl-6 cursor-pointer hover:underline"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{flow.name}</span>
                        <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                          ID #{flow.id}
                        </span>
                      </div>
                    </td>

                    <td className="py-4">
                      <button
                        onClick={() => toggleStatus(flow.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                          flow.status === 'Active'
                            ? 'border-emerald-500/80 bg-emerald-500/10 text-emerald-500'
                            : isDark
                            ? 'border-slate-700 bg-slate-900/60 text-slate-300'
                            : 'border-gray-200 bg-gray-100 text-gray-700'
                        }`}
                      >
                        {flow.status === 'Active' ? <CheckCircle2 size={13} /> : <Circle size={11} />}
                        {flow.status}
                      </button>
                    </td>

                    <td className="py-4 text-sm">{formatDate(flow.createdAt)}</td>
                    <td className="py-4 text-sm">{formatDate(flow.updatedAt)}</td>

                    <td className="py-4 pr-6 text-right relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === flow.id ? null : flow.id)}
                        className={`inline-flex items-center justify-center rounded-md p-1.5 transition-all ${
                          isDark
                            ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                            : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      {openMenuId === flow.id && (
                        <div
                          data-menu-id={flow.id}
                          className={`absolute right-4 mt-2 w-44 rounded-lg border shadow-xl z-30 overflow-hidden ${
                            isDark ? 'bg-[#050816] border-slate-800' : 'bg-white border-gray-200'
                          }`}
                        >
                          <button
                            onClick={() => handleOpenFlowBuilder(flow.id)}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs ${
                              isDark ? 'hover:bg-slate-900/60' : 'hover:bg-gray-50'
                            }`}
                          >
                            <PlayCircle size={14} />
                            Open Flow Builder
                          </button>
                          <button
                            onClick={() => toggleStatus(flow.id)}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs ${
                              isDark ? 'hover:bg-slate-900/60' : 'hover:bg-gray-50'
                            }`}
                          >
                            {flow.status === 'Active' ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
                            {flow.status === 'Active' ? 'Set as Inactive' : 'Set as Active'}
                          </button>
                          <button
                            onClick={() => handleEdit(flow.id)}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs ${
                              isDark ? 'hover:bg-slate-900/60' : 'hover:bg-gray-50'
                            }`}
                          >
                            <Edit3 size={14} />
                            Edit
                          </button>
                          <button
                            onClick={() => duplicateFlow(flow.id)}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs ${
                              isDark ? 'hover:bg-slate-900/60' : 'hover:bg-gray-50'
                            }`}
                          >
                            <Copy size={14} />
                            Duplicate
                          </button>
                          <div className={`h-px ${isDark ? 'bg-slate-800/80' : 'bg-gray-100'}`} />
                          <button
                            onClick={() => deleteFlow(flow.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-red-500 hover:bg-red-500/5"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>        
          )}
        </div>
      </div>
    </div>
  );
}