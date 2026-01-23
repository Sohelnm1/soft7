'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { X, Loader2, Trash2, Save, ArrowLeft } from 'lucide-react';
import { useTheme } from 'next-themes';

type FlowStatus = 'Active' | 'Inactive';

interface FlowData {
  id: number;
  name: string;
  status: FlowStatus;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export default function EditFlowPage() {
  const router = useRouter();
  const params = useParams();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const flowId = Number(params?.id);

  const [flowData, setFlowData] = useState<FlowData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadFlow();
  }, [flowId]);

  const loadFlow = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/flows/${flowId}`);
      
      if (!response.ok) throw new Error('Failed to load flow');
      
      const flow = await response.json();
      setFlowData(flow);
    } catch (error) {
      console.error('Error loading flow:', error);
      alert('Failed to load flow');
      router.push('/flows');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!flowData || !flowData.name.trim()) {
      alert('Please enter a flow name');
      return;
    }

    try {
      setIsSaving(true);
      
      const response = await fetch(`/api/flows/${flowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: flowData.name,
          status: flowData.status,
        }),
      });

      if (!response.ok) throw new Error('Failed to update flow');

      alert('Flow updated successfully!');
      router.push('/flows');
    } catch (error) {
      console.error('Error updating flow:', error);
      alert('Failed to update flow');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!flowData) return;

    try {
      const response = await fetch(`/api/flows/${flowId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete flow');

      alert('Flow deleted successfully');
      router.push('/flows');
    } catch (error) {
      console.error('Error deleting flow:', error);
      alert('Failed to delete flow');
    }
  };

  if (isLoading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDark ? 'bg-[#050816]' : 'bg-gray-50'
        }`}
      >
        <div className="text-center">
          <Loader2
            className={`w-8 h-8 animate-spin mx-auto mb-4 ${
              isDark ? 'text-emerald-400' : 'text-emerald-500'
            }`}
          />
          <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>Loading flow...</p>
        </div>
      </div>
    );
  }

  if (!flowData) {
    return null;
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
        <div className="flex items-center justify-between max-w-[1400px] mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/flows')}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'hover:bg-slate-800 text-slate-400 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Edit Flow</h1>
              <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                Update your automation workflow details
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/flows')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400 text-white px-5 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/30 text-sm font-medium"
            >
              {isSaving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 py-8">
        <div className="max-w-[800px] mx-auto">
          <div
            className={`rounded-2xl border p-8 ${
              isDark ? 'bg-[#050816] border-slate-800/60' : 'bg-white border-gray-200'
            }`}
          >
            <h2 className="text-xl font-semibold mb-6">Flow Details</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Flow Name */}
              <div>
                <label
                  htmlFor="flowName"
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-slate-200' : 'text-gray-700'
                  }`}
                >
                  Flow Name
                </label>
                <input
                  id="flowName"
                  type="text"
                  value={flowData.name}
                  onChange={(e) => setFlowData({ ...flowData, name: e.target.value })}
                  placeholder="My Awesome Flow"
                  className={`w-full border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all ${
                    isDark
                      ? 'bg-slate-900/40 border-slate-700 text-white placeholder-slate-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>

              {/* Flow Status */}
              <div>
                <label
                  className={`block text-sm font-medium mb-3 ${
                    isDark ? 'text-slate-200' : 'text-gray-700'
                  }`}
                >
                  Status
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFlowData({ ...flowData, status: 'Active' })}
                    className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      flowData.status === 'Active'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                        : isDark
                        ? 'border-slate-700 bg-slate-900/40 text-slate-400 hover:border-slate-600'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlowData({ ...flowData, status: 'Inactive' })}
                    className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      flowData.status === 'Inactive'
                        ? isDark
                          ? 'border-slate-600 bg-slate-800 text-white'
                          : 'border-gray-400 bg-gray-100 text-gray-900'
                        : isDark
                        ? 'border-slate-700 bg-slate-900/40 text-slate-400 hover:border-slate-600'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    Inactive
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Delete Section */}
          <div
            className={`rounded-2xl border p-6 mt-6 ${
              isDark ? 'bg-red-950/20 border-red-900/50' : 'bg-red-50 border-red-200'
            }`}
          >
            <h3 className="text-lg font-semibold mb-2 text-red-500">Danger Zone</h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
              Permanently delete this flow and all its data
            </p>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Trash2 size={16} />
              Delete Flow
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div
            className={`relative w-full max-w-sm rounded-2xl shadow-2xl p-6 border ${
              isDark
                ? 'bg-[#050816] border-slate-800'
                : 'bg-white border-gray-200'
            }`}
          >
            <h3 className="text-lg font-semibold mb-2 text-red-500">Delete Flow?</h3>
            <p className={`text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
              Are you sure you want to delete &quot;{flowData.name}&quot;? This action cannot be
              undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                  isDark
                    ? 'border-slate-700 bg-slate-900/40 text-slate-300 hover:bg-slate-800'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}