'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

type FlowStatus = 'Active' | 'Inactive';

interface FlowData {
  name: string;
  status: FlowStatus;
  description: string;
}

export default function CreateFlow() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const router = useRouter();

  const [flowData, setFlowData] = useState<FlowData>({
    name: '',
    status: 'Inactive',
    description: '',
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!flowData.name.trim()) {
      alert('Please enter a flow name!');
      return;
    }

    setIsSaving(true);
    
    try {
      const response = await fetch('/api/flows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: flowData.name,
          status: flowData.status,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create flow');
      }

      const newFlow = await response.json();
      
      // Redirect to flow builder
      router.push(`/flows/builder/${newFlow.id}`);
    } catch (error) {
      console.error('Error creating flow:', error);
      alert('Failed to create flow. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (flowData.name || flowData.description) {
      if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
        return;
      }
    }
    router.push('/flows');
  };

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
              onClick={handleCancel}
              disabled={isSaving}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'hover:bg-slate-800 text-slate-400 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              } disabled:opacity-50`}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Create New Flow</h1>
              <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                Configure your automation workflow
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400 text-white px-5 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/45 text-sm font-medium"
            >
              {isSaving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Create & Build
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
              isDark
                ? 'bg-[#050816] border-slate-800/60'
                : 'bg-white border-gray-200'
            }`}
          >
            <h2 className="text-xl font-semibold mb-6">Flow Details</h2>
            
            <form onSubmit={handleSave} className="space-y-6">
              {/* Flow Name */}
              <div>
                <label
                  htmlFor="flowName"
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-slate-200' : 'text-gray-700'
                  }`}
                >
                  Flow Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="flowName"
                  type="text"
                  value={flowData.name}
                  onChange={(e) =>
                    setFlowData({ ...flowData, name: e.target.value })
                  }
                  placeholder="e.g., Welcome sequence, Lead nurture..."
                  className={`w-full border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all ${
                    isDark
                      ? 'bg-slate-900/40 border-slate-700 text-white placeholder-slate-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  required
                  disabled={isSaving}
                />
                <p
                  className={`text-xs mt-2 ${
                    isDark ? 'text-slate-500' : 'text-gray-500'
                  }`}
                >
                  Give your flow a descriptive name that explains its purpose
                </p>
              </div>

              {/* Flow Description */}
              <div>
                <label
                  htmlFor="flowDescription"
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-slate-200' : 'text-gray-700'
                  }`}
                >
                  Description <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <textarea
                  id="flowDescription"
                  value={flowData.description}
                  onChange={(e) =>
                    setFlowData({ ...flowData, description: e.target.value })
                  }
                  placeholder="Describe what this flow does and when it should be used..."
                  rows={4}
                  className={`w-full border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none ${
                    isDark
                      ? 'bg-slate-900/40 border-slate-700 text-white placeholder-slate-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  disabled={isSaving}
                />
              </div>

              {/* Flow Status */}
              <div>
                <label
                  className={`block text-sm font-medium mb-3 ${
                    isDark ? 'text-slate-200' : 'text-gray-700'
                  }`}
                >
                  Initial Status
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFlowData({ ...flowData, status: 'Inactive' })
                    }
                    disabled={isSaving}
                    className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      flowData.status === 'Inactive'
                        ? isDark
                          ? 'border-slate-600 bg-slate-800 text-white'
                          : 'border-gray-400 bg-gray-100 text-gray-900'
                        : isDark
                        ? 'border-slate-700 bg-slate-900/40 text-slate-400 hover:border-slate-600'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    } disabled:opacity-50`}
                  >
                    Inactive (Recommended)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFlowData({ ...flowData, status: 'Active' })
                    }
                    disabled={isSaving}
                    className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      flowData.status === 'Active'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                        : isDark
                        ? 'border-slate-700 bg-slate-900/40 text-slate-400 hover:border-slate-600'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    } disabled:opacity-50`}
                  >
                    Active
                  </button>
                </div>
                <p
                  className={`text-xs mt-2 ${
                    isDark ? 'text-slate-500' : 'text-gray-500'
                  }`}
                >
                  {flowData.status === 'Active'
                    ? 'Flow will start running immediately after creation (not recommended for new flows)'
                    : 'Flow will be created as inactive - you can activate it after configuration'}
                </p>
              </div>
            </form>
          </div>

          {/* Tips Section */}
          <div
            className={`rounded-2xl border p-6 mt-6 ${
              isDark
                ? 'bg-blue-950/20 border-blue-900/50'
                : 'bg-blue-50 border-blue-200'
            }`}
          >
            <h3 className="text-lg font-semibold mb-3 text-blue-500">💡 Quick Tips</h3>
            <ul className={`space-y-2 text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Start with a clear, descriptive name that explains what the flow does</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Keep flows inactive while building and testing them</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>You'll be able to configure triggers, actions, and conditions in the builder</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Test your flow thoroughly before activating it</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}