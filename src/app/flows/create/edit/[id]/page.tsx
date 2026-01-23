'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { X, Loader2, Trash2 } from 'lucide-react';

type FlowStatus = 'Active' | 'Inactive';

interface FlowData {
  id: number;
  name: string;
  status: FlowStatus;
  description: string;
  created: string;
  updated: string;
}

// Mock data - replace with actual API call
const mockFlows: Record<number, FlowData> = {
  1: {
    id: 1,
    name: 'aaryan',
    status: 'Inactive',
    description: 'Welcome sequence for new users',
    created: 'Nov 06, 2025',
    updated: 'Nov 06, 2025',
  },
  2: {
    id: 2,
    name: 'harsh',
    status: 'Inactive',
    description: 'Lead nurture campaign',
    created: 'Oct 27, 2025',
    updated: 'Oct 27, 2025',
  },
  3: {
    id: 3,
    name: 'ganesh',
    status: 'Inactive',
    description: '',
    created: 'Oct 07, 2025',
    updated: 'Oct 07, 2025',
  },
  4: {
    id: 4,
    name: 'atharva',
    status: 'Inactive',
    description: '',
    created: 'Oct 04, 2025',
    updated: 'Oct 04, 2025',
  },
  5: {
    id: 5,
    name: 'Google Sheet',
    status: 'Inactive',
    description: '',
    created: 'Sep 05, 2025',
    updated: 'Sep 05, 2025',
  },
};

export default function EditFlowPage() {
  const router = useRouter();
  const params = useParams();
  const flowId = Number(params?.id);

  const [flowData, setFlowData] = useState<FlowData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    // Simulate loading flow data from API
    const loadFlow = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));

      const flow = mockFlows[flowId];
      if (flow) {
        setFlowData(flow);
      } else {
        alert('Flow not found');
        router.push('/flows');
      }
      setIsLoading(false);
    };

    if (flowId) {
      loadFlow();
    }
  }, [flowId, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!flowData || !flowData.name.trim()) {
      alert('Please enter a flow name');
      return;
    }

    // Handle flow update logic here
    console.log('Flow Updated:', flowData);

    // Redirect to flows list after updating
    router.push('/flows');
  };

  const handleDelete = async () => {
    if (!flowData) return;

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    console.log('Deleting flow:', flowData.id);
    router.push('/flows');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-emerald-500" />
          <p className="text-[var(--muted-foreground)]">Loading flow...</p>
        </div>
      </div>
    );
  }

  if (!flowData) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      <div className="relative w-full max-w-md rounded-2xl shadow-xl p-8 border border-[var(--border-color)] bg-[var(--card-bg)] transition-all duration-300">
        {/* Close Button */}
        <button
          onClick={() => router.push('/flows')}
          className="absolute top-4 right-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-semibold mb-2">Edit Flow</h2>
        <p className="text-sm text-[var(--muted-foreground)] mb-6">
          Update your automation flow details below.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="flowName"
              className="block text-sm font-medium mb-2 text-[var(--foreground)]"
            >
              Flow Name
            </label>
            <input
              id="flowName"
              type="text"
              value={flowData.name}
              onChange={(e) => setFlowData({ ...flowData, name: e.target.value })}
              placeholder="My Awesome Flow"
              className="w-full bg-transparent border border-[var(--border-color)] rounded-lg px-4 py-2 placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <p className="text-xs text-[var(--muted-foreground)] mt-2">
              Enter a descriptive name for your flow
            </p>
          </div>

          <div>
            <label
              htmlFor="flowDescription"
              className="block text-sm font-medium mb-2 text-[var(--foreground)]"
            >
              Description (Optional)
            </label>
            <textarea
              id="flowDescription"
              value={flowData.description}
              onChange={(e) => setFlowData({ ...flowData, description: e.target.value })}
              placeholder="Describe what this flow does..."
              rows={3}
              className="w-full bg-transparent border border-[var(--border-color)] rounded-lg px-4 py-2 placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-3 text-[var(--foreground)]">
              Status
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFlowData({ ...flowData, status: 'Active' })}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                  flowData.status === 'Active'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                    : 'border-[var(--border-color)] bg-transparent text-[var(--muted-foreground)] hover:border-emerald-500/50'
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setFlowData({ ...flowData, status: 'Inactive' })}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                  flowData.status === 'Inactive'
                    ? 'border-[var(--foreground)] bg-[var(--foreground)]/10 text-[var(--foreground)]'
                    : 'border-[var(--border-color)] bg-transparent text-[var(--muted-foreground)] hover:border-[var(--foreground)]/50'
                }`}
              >
                Inactive
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2.5 rounded-lg transition-all shadow-md shadow-emerald-500/30 hover:shadow-emerald-500/40 flex items-center justify-center gap-2"
          >
            Save Changes →
          </button>
        </form>

        {/* Delete Section */}
        <div className="mt-6 pt-6 border-t border-[var(--border-color)]">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-lg text-sm font-medium transition-all"
          >
            <Trash2 size={16} />
            Delete Flow
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="relative w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-[var(--border-color)] bg-[var(--card-bg)]">
            <h3 className="text-lg font-semibold mb-2 text-red-500">Delete Flow?</h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-6">
              Are you sure you want to delete &quot;{flowData.name}&quot;? This action cannot be
              undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border-color)] bg-transparent text-[var(--foreground)] hover:bg-[var(--foreground)]/5 transition-all"
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