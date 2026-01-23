'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Plus,
  X,
  Loader2,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { APP_INTEGRATIONS, AppIntegration, AppAction } from '@/lib/integrations/config';

interface FlowNode {
  id: string;
  type: 'trigger' | 'action';
  title: string;
  configured: boolean;
  appId?: string;
  actionId?: string;
  config?: Record<string, any>;
  icon?: string;
  position?: { x: number; y: number };
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
}

export default function FlowBuilderPage() {
  const router = useRouter();
  const params = useParams();
  const flowId = Number(params?.id);

  const [flowName, setFlowName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [edges, setEdges] = useState<FlowEdge[]>([]);
  const [isDraft, setIsDraft] = useState(true);

  // Modal state
  const [showAppSelector, setShowAppSelector] = useState(false);
  const [showActionSelector, setShowActionSelector] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeType, setSelectedNodeType] = useState<'trigger' | 'action'>('action');
  const [selectedApp, setSelectedApp] = useState<AppIntegration | null>(null);
  const [selectedAction, setSelectedAction] = useState<AppAction | null>(null);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [configFormData, setConfigFormData] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Test panel state
  const [testInput, setTestInput] = useState('{}');
  const [testOutput, setTestOutput] = useState('');
  const [testError, setTestError] = useState('');
  const [testTab, setTestTab] = useState<'output' | 'errors'>('output');

  useEffect(() => {
    loadFlow();
  }, [flowId]);

  const loadFlow = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/flows/${flowId}`);
      if (!response.ok) throw new Error('Failed to load flow');

      const flow = await response.json();
      setFlowName(flow.name);
      setIsDraft(flow.status === 'Inactive');

      const flowNodes = Array.isArray(flow.nodes) ? flow.nodes : [];
      const flowEdges = Array.isArray(flow.edges) ? flow.edges : [];

      if (flowNodes.length === 0) {
        setNodes([
          {
            id: 'trigger-1',
            type: 'trigger',
            title: 'Select Trigger',
            configured: false,
            position: { x: 0, y: 0 },
          },
        ]);
      } else {
        setNodes(flowNodes);
      }

      setEdges(flowEdges);
    } catch (error) {
      console.error('Error loading flow:', error);
      alert('Failed to load flow');
      router.push('/flows');
    } finally {
      setIsLoading(false);
    }
  };

  const saveFlow = async () => {
    try {
      setIsSaving(true);
      const response = await fetch(`/api/flows/${flowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges }),
      });

      if (!response.ok) throw new Error('Failed to save flow');
      alert('Flow saved successfully!');
    } catch (error) {
      console.error('Error saving flow:', error);
      alert('Failed to save flow');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    try {
      await saveFlow();
      const response = await fetch(`/api/flows/${flowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Active' }),
      });

      if (!response.ok) throw new Error('Failed to publish flow');
      setIsDraft(false);
      alert('Flow published successfully!');
    } catch (error) {
      console.error('Error publishing flow:', error);
      alert('Failed to publish flow');
    }
  };

  const handleAddNode = () => {
    const newNode: FlowNode = {
      id: `action-${Date.now()}`,
      type: 'action',
      title: 'Action',
      configured: false,
      position: { x: 0, y: 0 },
    };
    setNodes([...nodes, newNode]);

    if (nodes.length > 0) {
      const lastNode = nodes[nodes.length - 1];
      setEdges([
        ...edges,
        {
          id: `edge-${lastNode.id}-${newNode.id}`,
          source: lastNode.id,
          target: newNode.id,
        },
      ]);
    }
  };

  const handleRemoveNode = (nodeId: string) => {
    setNodes(nodes.filter((node) => node.id !== nodeId));
    setEdges(edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
  };

  const handleOpenAppSelector = (nodeId: string, nodeType: 'trigger' | 'action') => {
    setSelectedNodeId(nodeId);
    setSelectedNodeType(nodeType);
    setShowAppSelector(true);
    setSearchQuery('');
  };

  const handleSelectApp = (app: AppIntegration) => {
    setSelectedApp(app);
    setShowAppSelector(false);
    setShowActionSelector(true);
  };

  const handleSelectAction = (action: AppAction) => {
    setSelectedAction(action);
    setShowActionSelector(false);
    setShowConfigForm(true);

    const initialData: Record<string, any> = {};
    action.fields.forEach((field) => {
      initialData[field.id] = '';
    });
    setConfigFormData(initialData);
  };

  const handleSaveConfig = () => {
    if (!selectedNodeId || !selectedApp || !selectedAction) return;

    setNodes(
      nodes.map((node) => {
        if (node.id === selectedNodeId) {
          return {
            ...node,
            title: selectedAction.name,
            configured: true,
            appId: selectedApp.id,
            actionId: selectedAction.id,
            config: configFormData,
            icon: selectedApp.icon,
          };
        }
        return node;
      })
    );

    setShowConfigForm(false);
    setSelectedNodeId(null);
    setSelectedApp(null);
    setSelectedAction(null);
    setConfigFormData({});
  };

  const runTest = async () => {
    try {
      const body = JSON.parse(testInput || '{}');
      const response = await fetch(`/api/flows/${flowId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggerData: body }),
      });

      const data = await response.json();

      if (data.success) {
        setTestTab('output');
        setTestOutput(JSON.stringify(data, null, 2));
        setTestError('');
      } else {
        setTestTab('errors');
        setTestError(JSON.stringify(data, null, 2));
      }
    } catch (err) {
      setTestTab('errors');
      setTestError(String(err));
    }
  };

  // Filter apps based on node type (trigger or action)
  const getFilteredApps = () => {
    if (selectedNodeType === 'trigger') {
      // Only show apps that have triggers
      return APP_INTEGRATIONS.filter(
        (app) =>
          (app.type === 'trigger' || app.type === 'both') &&
          app.triggers &&
          app.triggers.length > 0 &&
          app.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else {
      // Only show apps that have actions
      return APP_INTEGRATIONS.filter(
        (app) =>
          (app.type === 'action' || app.type === 'both') &&
          app.actions &&
          app.actions.length > 0 &&
          app.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
  };

  const filteredApps = getFilteredApps();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-emerald-500" />
          <p className="text-[var(--muted-foreground)]">Loading flow builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      {/* Header */}
      <div className="border-b border-[var(--border-color)] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/flows')}
              className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold">{flowName}</h1>
                {isDraft && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-gray-500/10 text-gray-500 border border-gray-500/20">
                    Draft
                  </span>
                )}
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">
                Configure your automation workflow
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={saveFlow}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border-color)] hover:bg-[var(--muted)] transition-colors text-sm"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save
            </button>

            <button
              onClick={handlePublish}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors text-sm font-medium shadow-md shadow-emerald-500/20"
            >
              Publish
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex items-start justify-center p-8 min-h-[calc(100vh-120px)] overflow-auto">
        <div className="max-w-2xl w-full">
          <div className="flex justify-center mb-6">
            <button
              onClick={handleAddNode}
              className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all"
            >
              <Plus size={20} strokeWidth={2.5} />
            </button>
          </div>

          {/* Flow Nodes */}
          <div className="space-y-4">
            {nodes.map((node, index) => (
              <div key={node.id}>
                <div className="relative">
                  <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    {/* Node Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
                      <div className="flex items-center gap-3">
                        {node.icon && (
                          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-xl">
                            {node.icon}
                          </div>
                        )}
                        <div>
                          <h3 className="font-medium">{node.title}</h3>
                          {node.type === 'trigger' && (
                            <span className="text-xs text-blue-500">Trigger</span>
                          )}
                          {node.appId && (
                            <span className="text-xs text-[var(--muted-foreground)]">{node.appId}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {node.configured && (
                          <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            <CheckCircle2 size={12} />
                            Configured
                          </span>
                        )}
                        {node.type === 'action' && (
                          <button
                            onClick={() => handleRemoveNode(node.id)}
                            className="p-1 hover:bg-red-500/10 hover:text-red-500 rounded transition-colors"
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Node Body */}
                    <div className="p-4">
                      {node.configured ? (
                        <div className="space-y-2">
                          <p className="text-sm text-[var(--muted-foreground)]">Configuration saved</p>
                          {node.config && (
                            <div className="text-xs space-y-1">
                              {Object.entries(node.config)
                                .slice(0, 2)
                                .map(([key, value]) => (
                                  <div key={key} className="text-[var(--muted-foreground)]">
                                    <span className="font-medium">{key}:</span>{' '}
                                    {String(value).slice(0, 30)}
                                    {String(value).length > 30 && '...'}
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenAppSelector(node.id, node.type)}
                          className="w-full flex items-center justify-center gap-2 py-3 text-sm text-emerald-500 hover:bg-emerald-500/5 rounded-lg border-2 border-dashed border-emerald-500/30 hover:border-emerald-500/50 transition-all"
                        >
                          <Plus size={16} />
                          Choose {node.type === 'trigger' ? 'Trigger' : 'Action'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {index < nodes.length - 1 && (
                  <div className="flex justify-center py-3">
                    <div className="w-0.5 h-8 bg-gradient-to-b from-emerald-500 to-emerald-500/30"></div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-6">
            <button
              onClick={handleAddNode}
              className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all"
            >
              <Plus size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* App Selector Modal */}
      {showAppSelector && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg max-h-[80vh] rounded-2xl bg-[var(--card-bg)] border border-[var(--border-color)] shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
              <h2 className="text-lg font-semibold">
                Select {selectedNodeType === 'trigger' ? 'Trigger' : 'App'}
              </h2>
              <button onClick={() => setShowAppSelector(false)} className="p-1 rounded hover:bg-[var(--muted)]">
                <X size={18} />
              </button>
            </div>

            <div className="p-3 border-b border-[var(--border-color)]">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-md text-sm border bg-transparent outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {filteredApps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => handleSelectApp(app)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-emerald-500/10 transition-colors text-sm border-b border-[var(--border-color)] last:border-b-0"
                >
                  <span className="text-2xl">{app.icon}</span>
                  <div className="text-left">
                    <div className="font-medium">{app.name}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">
                      {selectedNodeType === 'trigger'
                        ? `${app.triggers?.length || 0} trigger${(app.triggers?.length || 0) !== 1 ? 's' : ''}`
                        : `${app.actions.length} action${app.actions.length !== 1 ? 's' : ''}`}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action/Trigger Selector Modal */}
      {showActionSelector && selectedApp && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg max-h-[80vh] rounded-2xl bg-[var(--card-bg)] border border-[var(--border-color)] shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowActionSelector(false);
                    setShowAppSelector(true);
                  }}
                  className="p-1 rounded hover:bg-[var(--muted)]"
                >
                  <ArrowLeft size={16} />
                </button>
                <h2 className="text-lg font-semibold">
                  Select {selectedNodeType === 'trigger' ? 'Trigger' : 'Action'} - {selectedApp.name}
                </h2>
              </div>
              <button onClick={() => setShowActionSelector(false)} className="p-1 rounded hover:bg-[var(--muted)]">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {(selectedNodeType === 'trigger' ? selectedApp.triggers : selectedApp.actions)?.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleSelectAction(action)}
                  className="w-full px-4 py-3 text-left hover:bg-emerald-500/10 transition-colors border-b border-[var(--border-color)] last:border-b-0"
                >
                  <div className="font-medium text-sm">{action.name}</div>
                  <div className="text-xs text-[var(--muted-foreground)] mt-1">{action.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Config Form Modal */}
      {showConfigForm && selectedAction && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg max-h-[80vh] rounded-2xl bg-[var(--card-bg)] border border-[var(--border-color)] shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
              <h2 className="text-lg font-semibold">Configure - {selectedAction.name}</h2>
              <button onClick={() => setShowConfigForm(false)} className="p-1 rounded hover:bg-[var(--muted)]">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-4">
              {selectedAction.fields.map((field) => (
                <div key={field.id}>
                  <label className="block text-sm font-medium mb-2">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>

                  {field.type === 'textarea' ? (
                    <textarea
                      value={configFormData[field.id] || ''}
                      onChange={(e) => setConfigFormData({ ...configFormData, [field.id]: e.target.value })}
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 rounded-md border bg-transparent outline-none focus:border-emerald-500 transition resize-none"
                      rows={3}
                      required={field.required}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      value={configFormData[field.id] || ''}
                      onChange={(e) => setConfigFormData({ ...configFormData, [field.id]: e.target.value })}
                      className="w-full px-3 py-2 rounded-md border bg-transparent outline-none focus:border-emerald-500 transition"
                      required={field.required}
                    >
                      <option value="">Select...</option>
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={configFormData[field.id] || ''}
                      onChange={(e) => setConfigFormData({ ...configFormData, [field.id]: e.target.value })}
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 rounded-md border bg-transparent outline-none focus:border-emerald-500 transition"
                      required={field.required}
                    />
                  )}

                  {field.description && (
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">{field.description}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-[var(--border-color)] flex gap-3">
              <button
                onClick={() => setShowConfigForm(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-[var(--border-color)] hover:bg-[var(--muted)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfig}
                className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors font-medium"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Panel */}
      <div className="fixed right-4 bottom-6 w-96 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-xl p-4 z-50">
        <h2 className="text-lg font-semibold mb-3">Run Test</h2>

        <label className="text-sm font-medium">Input JSON</label>
        <textarea
          value={testInput}
          onChange={(e) => setTestInput(e.target.value)}
          className="w-full h-28 p-2 mt-1 rounded-md border bg-transparent text-sm"
        />

        <button
          onClick={runTest}
          className="mt-3 w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg font-medium"
        >
          Run Test
        </button>

        <div className="mt-4">
          <div className="flex gap-3 text-sm mb-2">
            <button
              onClick={() => setTestTab('output')}
              className={testTab === 'output' ? 'font-bold' : ''}
            >
              Output
            </button>
            <button
              onClick={() => setTestTab('errors')}
              className={testTab === 'errors' ? 'font-bold' : ''}
            >
              Errors
            </button>
          </div>

          {testTab === 'output' && (
            <pre className="text-xs bg-black/20 p-2 rounded-md h-40 overflow-auto">{testOutput}</pre>
          )}

          {testTab === 'errors' && (
            <pre className="text-xs bg-red-500/20 p-2 rounded-md h-40 overflow-auto text-red-400">
              {testError}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}