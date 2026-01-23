"use client";

import {
  Background,
  Controls,
  ReactFlow,
  useEdgesState,
  useNodesState,
  addEdge,
  Connection,
  MarkerType,
  NodeProps,
  useReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
} from "reactflow";

import "reactflow/dist/style.css";
import { useState, useMemo, useCallback, useRef } from "react";
import { Save, Trash2, Download, Upload, Undo, Redo, X, Plus, Minus } from "lucide-react";

/* UUID Generator */
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/* Node Card Component */
function Card({ title, children, gradient, icon }: any) {
  return (
    <div style={{
      minWidth: "220px",
      borderRadius: "14px",
      overflow: "hidden",
      background: "rgba(17, 24, 39, 0.95)",
      border: "1px solid rgba(255,255,255,0.1)",
      boxShadow: "0 8px 22px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.05)",
      backdropFilter: "blur(12px)",
    }}>
      <div className={gradient} style={{
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        fontWeight: 600,
        fontSize: "14px",
        color: "white",
        textShadow: "0 1px 2px rgba(0,0,0,0.4)",
      }}>
        <span style={{ fontSize: "18px" }}>{icon}</span>
        <div>{title}</div>
      </div>
      <div style={{
        padding: "16px",
        background: "rgba(15, 15, 25, 0.6)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}>
        {children}
      </div>
    </div>
  );
}

/* Node Components */
const TriggerNode = ({ data }: any) => (
  <div>
    <Card title="Trigger" gradient="gradient-purple-indigo" icon="⚡">
      <div style={{
        fontSize: '12px',
        fontWeight: 500,
        color: '#cbd5e1',
        background: 'rgba(2, 6, 23, 0.4)',
        padding: '6px 10px',
        borderRadius: '6px'
      }}>
        {data?.label || "On Message"}
      </div>
    </Card>
    <Handle type="source" position={Position.Right} id="out" style={{
      width: '12px',
      height: '12px',
      background: '#6366f1',
      border: '2px solid white'
    }} />
  </div>
);

const MessageNode = ({ data }: any) => (
  <div>
    <Handle type="target" position={Position.Left} id="in" style={{
      width: '12px',
      height: '12px',
      background: '#3b82f6',
      border: '2px solid white'
    }} />
    <Card title="Message" gradient="gradient-blue-cyan" icon="💬">
      <div style={{
        background: 'rgba(2, 6, 23, 0.4)',
        padding: '10px 12px',
        borderRadius: '8px',
        minHeight: '40px'
      }}>
        <p style={{ fontSize: '14px', lineHeight: '1.5', margin: 0, color: '#e2e8f0' }}>
          {data?.text || "Hello 👋"}
        </p>
      </div>
    </Card>
    <Handle type="source" position={Position.Right} id="out" style={{
      width: '12px',
      height: '12px',
      background: '#06b6d4',
      border: '2px solid white'
    }} />
  </div>
);

const AINode = ({ data }: any) => (
  <div>
    <Handle type="target" position={Position.Left} id="in" style={{
      width: '12px',
      height: '12px',
      background: '#10b981',
      border: '2px solid white'
    }} />
    <Card title="AI Response" gradient="gradient-green-emerald" icon="🤖">
      <div style={{
        background: 'rgba(2, 6, 23, 0.4)',
        padding: '10px 12px',
        borderRadius: '8px'
      }}>
        <p style={{
          fontSize: '12px',
          fontFamily: "'Courier New', monospace",
          lineHeight: '1.6',
          color: '#a7f3d0',
          wordBreak: 'break-word',
          margin: 0
        }}>
          {data?.prompt || "AI Response"}
        </p>
      </div>
    </Card>
    <Handle type="source" position={Position.Right} id="out" style={{
      width: '12px',
      height: '12px',
      background: '#059669',
      border: '2px solid white'
    }} />
  </div>
);

const ConditionNode = ({ data }: any) => (
  <div>
    <Handle type="target" position={Position.Left} id="in" style={{
      width: '12px',
      height: '12px',
      background: '#f59e0b',
      border: '2px solid white'
    }} />
    <Card title="Condition" gradient="gradient-amber-orange" icon="🔀">
      <div style={{
        background: 'rgba(2, 6, 23, 0.4)',
        padding: '10px 12px',
        borderRadius: '8px',
        marginBottom: '10px'
      }}>
        <code style={{
          fontSize: '12px',
          color: '#fde68a',
          fontFamily: "'Courier New', monospace",
          wordBreak: 'break-word'
        }}>
          {data?.expr || `includes(text,"hi")`}
        </code>
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '11px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#4ade80'
          }}></div>
          <span style={{ color: '#86efac', fontWeight: 600 }}>TRUE</span>
        </div>
        <span style={{ color: '#64748b' }}>|</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#fbbf24'
          }}></div>
          <span style={{ color: '#fde047', fontWeight: 600 }}>FALSE</span>
        </div>
      </div>
    </Card>
    <Handle type="source" position={Position.Right} id="true" style={{
      top: 32,
      width: '12px',
      height: '12px',
      background: '#10b981',
      border: '2px solid white'
    }} />
    <Handle type="source" position={Position.Right} id="false" style={{
      top: 68,
      width: '12px',
      height: '12px',
      background: '#f59e0b',
      border: '2px solid white'
    }} />
  </div>
);

const ActionNode = ({ data }: any) => (
  <div>
    <Handle type="target" position={Position.Left} id="in" style={{
      width: '12px',
      height: '12px',
      background: '#ec4899',
      border: '2px solid white'
    }} />
    <Card title="HTTP Request" gradient="gradient-pink-rose" icon="🌐">
      <div style={{
        background: 'rgba(2, 6, 23, 0.4)',
        padding: '10px 12px',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        <span style={{
          fontSize: '12px',
          fontWeight: 700,
          color: '#f9a8d4',
          background: 'rgba(236, 72, 153, 0.2)',
          padding: '3px 10px',
          borderRadius: '4px',
          display: 'inline-block',
          width: 'fit-content'
        }}>
          {data?.method || "POST"}
        </span>
        <div style={{
          fontSize: '12px',
          color: '#cbd5e1',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontFamily: "'Courier New', monospace"
        }}>
          {data?.url || "https://endpoint.com"}
        </div>
      </div>
    </Card>
    <Handle type="source" position={Position.Right} id="out" style={{
      width: '12px',
      height: '12px',
      background: '#f43f5e',
      border: '2px solid white'
    }} />
  </div>
);

const ButtonMessageNode = ({ data }: any) => {
  const buttons = Array.isArray(data?.buttons) ? data.buttons : ["Option 1"];
  const baseY = 68;
  const gap = 32;

  return (
    <div>
      <Handle type="target" position={Position.Left} id="in" style={{
        width: '12px',
        height: '12px',
        background: '#a855f7',
        border: '2px solid white'
      }} />
      <Card title="Button Message" gradient="gradient-blue-purple" icon="🔘">
        <div style={{
          background: 'rgba(2, 6, 23, 0.4)',
          padding: '10px 12px',
          borderRadius: '8px',
          marginBottom: '10px'
        }}>
          <p style={{ fontSize: '14px', color: '#e2e8f0', margin: 0 }}>
            {data?.text || "Choose an option:"}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {buttons.map((btn: string, i: number) => (
            <div key={i} style={{
              background: 'linear-gradient(to right, #6366f1, #a855f7)',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 500,
              textAlign: 'center',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              {btn}
            </div>
          ))}
        </div>
      </Card>
      {buttons.map((btn: string, i: number) => (
        <Handle key={i} id={`btn_${i}`} type="source" position={Position.Right} title={btn} style={{
          top: baseY + i * gap,
          width: '12px',
          height: '12px',
          background: '#a855f7',
          border: '2px solid white'
        }} />
      ))}
    </div>
  );
};

const ImageNode = ({ data }: any) => {
  const images = Array.isArray(data?.images) ? data.images : [{ url: "", caption: "" }];
  
  return (
    <div>
      <Handle type="target" position={Position.Left} id="in" style={{
        width: '12px',
        height: '12px',
        background: '#8b5cf6',
        border: '2px solid white'
      }} />
      <Card title="Image" gradient="gradient-purple-pink" icon="🖼️">
        <div style={{
          background: 'rgba(2, 6, 23, 0.4)',
          padding: '10px 12px',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {images.map((img: any, i: number) => (
            <div key={i} style={{
              background: 'rgba(0, 0, 0, 0.2)',
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid rgba(139, 92, 246, 0.3)'
            }}>
              {img.url ? (
                <div style={{
                  width: '100%',
                  height: '80px',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  background: '#1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: img.caption ? '6px' : 0
                }}>
                  <img 
                    src={img.url} 
                    alt="Preview" 
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain'
                    }}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                      (e.target as HTMLElement).parentElement!.innerHTML = '<span style="color: #94a3b8; font-size: 11px;">Invalid URL</span>';
                    }}
                  />
                </div>
              ) : (
                <div style={{
                  width: '100%',
                  height: '80px',
                  borderRadius: '4px',
                  background: '#1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px dashed #334155',
                  marginBottom: img.caption ? '6px' : 0
                }}>
                  <span style={{ fontSize: '28px', opacity: 0.5 }}>🖼️</span>
                </div>
              )}
              {img.caption && (
                <p style={{
                  fontSize: '11px',
                  color: '#cbd5e1',
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  {img.caption}
                </p>
              )}
            </div>
          ))}
          {images.length > 1 && (
            <div style={{
              fontSize: '10px',
              color: '#8b5cf6',
              fontWeight: 600,
              textAlign: 'center',
              padding: '4px',
              background: 'rgba(139, 92, 246, 0.1)',
              borderRadius: '4px'
            }}>
              {images.length} Images
            </div>
          )}
        </div>
      </Card>
      <Handle type="source" position={Position.Right} id="out" style={{
        width: '12px',
        height: '12px',
        background: '#7c3aed',
        border: '2px solid white'
      }} />
    </div>
  );
};

const nodeTypes = {
  trigger: TriggerNode,
  message: MessageNode,
  ai: AINode,
  condition: ConditionNode,
  action: ActionNode,
  buttonMessage: ButtonMessageNode,
  image: ImageNode,
};

function canConnect(sourceType?: string, targetType?: string, sourceHandle?: string) {
  if (!sourceType || !targetType) return false;
  if (targetType === "trigger") return false;
  if (sourceType === "condition" && !["true", "false"].includes(sourceHandle || "")) return false;
  if (sourceType === "buttonMessage" && !sourceHandle?.startsWith("btn_")) return false;
  return true;
}

function branchToStyle(branch?: string) {
  if (branch === "true") return { stroke: "#10b981", strokeWidth: 2.5 };
  if (branch === "false") return { stroke: "#f59e0b", strokeWidth: 2.5 };
  return { stroke: "#6366f1", strokeWidth: 2 };
}

/* Main Builder Component */
function BuilderCanvasInner({ bot }: any) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();

  const initialNodes = (bot.nodes ?? []).map((n: any) => ({
    id: n.id,
    type: n.type,
    data: n.data,
    position: n.position ?? { x: 100, y: 100 },
  }));

  const initialEdges = (bot.edges ?? []).map((e: any) => {
    const branch = e?.data?.branch || (["true", "false"].includes((e.label || "").toLowerCase()) ? e.label.toLowerCase() : undefined);
    return {
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.data?.sourceHandle || e.sourceHandle || null,
      targetHandle: e.data?.targetHandle || e.targetHandle || "in",
      label: branch === "true" ? "True" : branch === "false" ? "False" : e.label,
      data: { ...(e.data ?? {}), ...(branch ? { branch } : {}), sourceHandle: e.data?.sourceHandle || e.sourceHandle, targetHandle: e.data?.targetHandle || e.targetHandle || "in" },
      markerEnd: { type: MarkerType.ArrowClosed },
      style: branchToStyle(branch),
    };
  });
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>(() => [{ nodes: initialNodes, edges: initialEdges }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isInitialMount = useRef(true);

  const saveToHistory = useCallback((newNodes: any[], newEdges: any[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ nodes: newNodes, edges: newEdges });
      if (newHistory.length > 50) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setNodes(prev.nodes);
      setEdges(prev.edges);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setNodes(next.nodes);
      setEdges(next.edges);
      setHistoryIndex(historyIndex + 1);
    }
  };

  const getDefaultData = (type: string) => {
    switch (type) {
      case "message": return { text: "Hello!" };
      case "ai": return { prompt: "Answer politely." };
      case "condition": return { expr: `includes(text,"hi")` };
      case "action": return { url: "https://example.com", method: "POST", body: "{}" };
      case "buttonMessage": return { text: "Choose:", buttons: ["Option 1", "Option 2"] };
      case "image": return { images: [{ url: "", caption: "" }] };
      case "trigger": return { label: "on message" };
      default: return {};
    }
  };

  const addNode = (type: string, position?: any) => {
    const id = uuid();
    const newNodes = [...nodes, {
      id,
      type,
      data: getDefaultData(type),
      position: position ?? { x: 200 + Math.random() * 120, y: 200 + Math.random() * 120 },
    }];
    setNodes(newNodes);
    saveToHistory(newNodes, edges);
  };

  const deleteNode = useCallback((id: string) => {
    const newNodes = nodes.filter((n) => n.id !== id);
    const newEdges = edges.filter((e) => e.source !== id && e.target !== id);
    setNodes(newNodes);
    setEdges(newEdges);
    if (selectedNodeId === id) setSelectedNodeId(null);
    saveToHistory(newNodes, newEdges);
  }, [nodes, edges, selectedNodeId]);

  const wrapNode = (Component: any) => (props: NodeProps) => {
    const isSelected = props.id === selectedNodeId;
    return (
      <div style={{ position: 'relative' }} onClick={(e) => {
        e.stopPropagation();
        setSelectedNodeId(props.id);
      }}>
        <div style={{
          position: 'absolute',
          inset: '-4px',
          borderRadius: '16px',
          border: isSelected ? '2px solid #6366f1' : 'none',
          pointerEvents: 'none',
          boxShadow: isSelected ? '0 0 0 4px rgba(99, 102, 241, 0.1)' : 'none',
        }} />
        <button style={{
          position: 'absolute',
          top: '-10px',
          right: '-10px',
          width: '26px',
          height: '26px',
          borderRadius: '50%',
          background: '#ef4444',
          border: '2px solid white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 10,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }} onClick={(e) => { e.stopPropagation(); deleteNode(props.id); }}>
          <Trash2 style={{ width: '14px', height: '14px', color: 'white' }} />
        </button>
        <Component {...props} />
      </div>
    );
  };

  const nodeTypesWithDelete = useMemo(() => {
    const mapped: any = {};
    Object.keys(nodeTypes).forEach((k) => {
      mapped[k] = wrapNode((nodeTypes as any)[k]);
    });
    return mapped;
  }, [selectedNodeId]);

  const onConnect = useCallback((conn: Connection) => {
    const src = nodes.find((n) => n.id === conn.source);
    const tgt = nodes.find((n) => n.id === conn.target);
    if (!canConnect(src?.type, tgt?.type, conn.sourceHandle)) return;

    let data: any = { sourceHandle: conn.sourceHandle, targetHandle: conn.targetHandle || "in" };
    let label: string | undefined;

    if (src?.type === "buttonMessage") {
      const index = Number(conn.sourceHandle?.replace("btn_", ""));
      label = src.data.buttons[index];
    }

    if (src?.type === "condition") {
      const h = conn.sourceHandle;
      if (h === "true" || h === "false") {
        data.branch = h;
        label = h === "true" ? "True" : "False";
      }
    }

    const edge = {
      id: uuid(),
      source: conn.source!,
      target: conn.target!,
      sourceHandle: conn.sourceHandle || null,
      targetHandle: conn.targetHandle || "in",
      label,
      data,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: branchToStyle(data.branch),
    };

    const newEdges = addEdge(edge, edges);
    setEdges(newEdges);
    saveToHistory(nodes, newEdges);
  }, [nodes, edges]);

  const onEdgeUpdate = useCallback((oldEdge: any, newConnection: Connection) => {
    const src = nodes.find((n) => n.id === newConnection.source);
    const tgt = nodes.find((n) => n.id === newConnection.target);
    if (!canConnect(src?.type, tgt?.type, newConnection.sourceHandle)) return;

    let data: any = { sourceHandle: newConnection.sourceHandle, targetHandle: newConnection.targetHandle || "in" };
    let label: string | undefined;

    if (src?.type === "buttonMessage") {
      const index = Number(newConnection.sourceHandle?.replace("btn_", ""));
      label = src.data.buttons[index];
    }

    if (src?.type === "condition") {
      const h = newConnection.sourceHandle;
      if (h === "true" || h === "false") {
        data.branch = h;
        label = h === "true" ? "True" : "False";
      }
    }

    const newEdges = edges.map((edge) =>
      edge.id === oldEdge.id
        ? {
            ...edge,
            source: newConnection.source!,
            target: newConnection.target!,
            sourceHandle: newConnection.sourceHandle || null,
            targetHandle: newConnection.targetHandle || "in",
            label,
            data,
            style: branchToStyle(data.branch),
          }
        : edge
    );

    setEdges(newEdges);
    saveToHistory(nodes, newEdges);
  }, [nodes, edges]);

  const onDragStart = (e: any, type: string) => {
    e.dataTransfer.setData("application/reactflow", type);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: any) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const onDrop = useCallback((e: any) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("application/reactflow");
    if (!type) return;
    const position = reactFlowInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY });
    addNode(type, position);
  }, [reactFlowInstance, nodes, edges]);

  const save = async () => {
    try {
      const res = await fetch(`/api/chatbots/${bot.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: bot.name,
          nodes,
          edges,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save chatbot");
      }

      alert("Chatbot saved successfully ✅");
    } catch (err) {
      console.error(err);
      alert("Error saving chatbot ❌");
    }
  };

  const exportFlow = () => {
    const data = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chatbot-flow.json';
    a.click();
  };

  const importFlow = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
        saveToHistory(data.nodes || [], data.edges || []);
        alert("Flow imported! ✅");
      } catch (err) {
        alert("Invalid file format");
      }
    };
    reader.readAsText(file);
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  const updateNode = (changes: any) => {
    if (!selectedNode) return;
    const newNodes = nodes.map((n) => n.id === selectedNode.id ? { ...n, data: { ...n.data, ...changes } } : n);
    setNodes(newNodes);
    saveToHistory(newNodes, edges);
  };

  const nodeCategories = [
    { title: "Flow", nodes: [{ type: "trigger", label: "Trigger", icon: "⚡", color: "gradient-purple-indigo" }] },
    { title: "Messages", nodes: [
      { type: "message", label: "Message", icon: "💬", color: "gradient-blue-cyan" },
      { type: "buttonMessage", label: "Buttons", icon: "🔘", color: "gradient-blue-purple" },
      { type: "image", label: "Image", icon: "🖼️", color: "gradient-purple-pink" }
    ]},
    { title: "Logic", nodes: [
      { type: "ai", label: "AI", icon: "🤖", color: "gradient-green-emerald" },
      { type: "condition", label: "Condition", icon: "🔀", color: "gradient-amber-orange" }
    ]},
    { title: "Actions", nodes: [{ type: "action", label: "HTTP", icon: "🌐", color: "gradient-pink-rose" }] },
  ];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#0f172a",
        color: "white",
        overflow: "hidden",
      }}
    >
      {/* Top Bar */}
      <div style={{
        height: "64px",
        borderBottom: "1px solid #1e293b",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        background: "#1e293b",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
          }}>⚡</div>
          <div>
            <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>{bot.name}</h1>
            <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>Flow Builder</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={undo} disabled={historyIndex === 0} style={{
            background: historyIndex === 0 ? "#374151" : "#475569",
            border: "none",
            padding: "8px 12px",
            borderRadius: "8px",
            color: "white",
            cursor: historyIndex === 0 ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}>
            <Undo style={{ width: "16px", height: "16px" }} />
          </button>
          <button onClick={redo} disabled={historyIndex === history.length - 1} style={{
            background: historyIndex === history.length - 1 ? "#374151" : "#475569",
            border: "none",
            padding: "8px 12px",
            borderRadius: "8px",
            color: "white",
            cursor: historyIndex === history.length - 1 ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}>
            <Redo style={{ width: "16px", height: "16px" }} />
          </button>
          <button onClick={exportFlow} style={{
            background: "#475569",
            border: "none",
            padding: "8px 16px",
            borderRadius: "8px",
            color: "white",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}>
            <Download style={{ width: "16px", height: "16px" }} />
            Export
          </button>
          <label style={{
            background: "#475569",
            border: "none",
            padding: "8px 16px",
            borderRadius: "8px",
            color: "white",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}>
            <Upload style={{ width: "16px", height: "16px" }} />
            Import
            <input type="file" accept=".json" onChange={importFlow} style={{ display: "none" }} />
          </label>
          <button onClick={save} style={{
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            border: "none",
            padding: "10px 20px",
            borderRadius: "8px",
            color: "white",
            fontWeight: 500,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <Save style={{ width: "18px", height: "18px" }} />
            Save
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          display: "flex",
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* Left Sidebar */}
        <aside style={{
          width: "280px",
          borderRight: "1px solid #1e293b",
          background: "#1e293b",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
          <div style={{ padding: "20px", borderBottom: "1px solid #334155" }}>
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
              <span>🧩</span>Components
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#94a3b8" }}>Drag to canvas</p>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
            {nodeCategories.map((category) => (
              <div key={category.title} style={{ marginBottom: "24px" }}>
                <h3 style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "12px",
                }}>{category.title}</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {category.nodes.map((node) => (
                    <div key={node.type} draggable onDragStart={(e) => onDragStart(e, node.type)} className={node.color} style={{
                      padding: "12px",
                      borderRadius: "8px",
                      cursor: "grab",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      fontWeight: 500,
                      fontSize: "14px",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}>
                      <span style={{ fontSize: "20px" }}>{node.icon}</span>
                      <div>{node.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Canvas */}
        <div
          ref={wrapperRef}
          style={{
            flex: 1,
            height: "100%",
            minHeight: 0,
          }}
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgeUpdate={onEdgeUpdate}
            nodeTypes={nodeTypesWithDelete}
            edgesUpdatable
            edgesFocusable
            fitView
            style={{ width: "100%", height: "100%" }}
          >
            <Background color="#1e293b" />
            <Controls />
          </ReactFlow>
        </div>

        {/* Right Inspector Panel */}
        <aside
          style={{
            width: "260px",
            minWidth: "240px",
            borderLeft: "1px solid #1e293b",
            background: "#1e293b",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div style={{
            padding: "20px",
            borderBottom: "1px solid #334155",
          }}>
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>
              {selectedNode ? "Node Settings" : "Inspector"}
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#94a3b8" }}>
              {selectedNode ? selectedNode.type : "Select a node to edit"}
            </p>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
            {!selectedNode ? (
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "#64748b",
                textAlign: "center",
                padding: "40px 20px",
              }}>
                <div style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "rgba(99, 102, 241, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "20px",
                  fontSize: "36px",
                }}>
                  ⚙️
                </div>
                <h3 style={{ margin: "0 0 8px", fontSize: "16px", color: "#94a3b8" }}>
                  No Node Selected
                </h3>
                <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.6" }}>
                  Click on any node in the canvas to view and edit its properties here.
                </p>
              </div>
            ) : (
              <>
                {selectedNode.type === "message" && (
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#cbd5e1", marginBottom: "8px" }}>
                      Message Text
                    </label>
                    <textarea
                      value={selectedNode.data.text || ""}
                      onChange={(e) => updateNode({ text: e.target.value })}
                      style={{
                        width: "100%",
                        minHeight: "100px",
                        padding: "12px",
                        background: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                        color: "white",
                        fontSize: "14px",
                        fontFamily: "inherit",
                        resize: "vertical",
                      }}
                      placeholder="Enter message text..."
                    />
                  </div>
                )}

                {selectedNode.type === "ai" && (
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#cbd5e1", marginBottom: "8px" }}>
                      AI Prompt
                    </label>
                    <textarea
                      value={selectedNode.data.prompt || ""}
                      onChange={(e) => updateNode({ prompt: e.target.value })}
                      style={{
                        width: "100%",
                        minHeight: "120px",
                        padding: "12px",
                        background: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                        color: "#a7f3d0",
                        fontSize: "13px",
                        fontFamily: "'Courier New', monospace",
                        resize: "vertical",
                      }}
                      placeholder="Enter AI prompt..."
                    />
                  </div>
                )}

                {selectedNode.type === "condition" && (
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#cbd5e1", marginBottom: "8px" }}>
                      Condition Expression
                    </label>
                    <input
                      type="text"
                      value={selectedNode.data.expr || ""}
                      onChange={(e) => updateNode({ expr: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "12px",
                        background: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                        color: "#fde68a",
                        fontSize: "13px",
                        fontFamily: "'Courier New', monospace",
                      }}
                      placeholder='includes(text,"keyword")'
                    />
                    <p style={{ fontSize: "11px", color: "#64748b", marginTop: "8px" }}>
                      Examples: includes(text,"hi"), startsWith(text,"hello"), length(text) {">"} 10
                    </p>
                  </div>
                )}

                {selectedNode.type === "action" && (
                  <div>
                    <div style={{ marginBottom: "16px" }}>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#cbd5e1", marginBottom: "8px" }}>
                        Method
                      </label>
                      <select
                        value={selectedNode.data.method || "POST"}
                        onChange={(e) => updateNode({ method: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "10px",
                          background: "#0f172a",
                          border: "1px solid #334155",
                          borderRadius: "8px",
                          color: "white",
                          fontSize: "14px",
                        }}
                      >
                        <option>GET</option>
                        <option>POST</option>
                        <option>PUT</option>
                        <option>DELETE</option>
                      </select>
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#cbd5e1", marginBottom: "8px" }}>
                        URL
                      </label>
                      <input
                        type="text"
                        value={selectedNode.data.url || ""}
                        onChange={(e) => updateNode({ url: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "12px",
                          background: "#0f172a",
                          border: "1px solid #334155",
                          borderRadius: "8px",
                          color: "white",
                          fontSize: "13px",
                          fontFamily: "'Courier New', monospace",
                        }}
                        placeholder="https://api.example.com/endpoint"
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#cbd5e1", marginBottom: "8px" }}>
                        Body (JSON)
                      </label>
                      <textarea
                        value={selectedNode.data.body || ""}
                        onChange={(e) => updateNode({ body: e.target.value })}
                        style={{
                          width: "100%",
                          minHeight: "100px",
                          padding: "12px",
                          background: "#0f172a",
                          border: "1px solid #334155",
                          borderRadius: "8px",
                          color: "white",
                          fontSize: "12px",
                          fontFamily: "'Courier New', monospace",
                          resize: "vertical",
                        }}
                        placeholder='{"key": "value"}'
                      />
                    </div>
                  </div>
                )}

                {selectedNode.type === "buttonMessage" && (
                  <div>
                    <div style={{ marginBottom: "16px" }}>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#cbd5e1", marginBottom: "8px" }}>
                        Message Text
                      </label>
                      <textarea
                        value={selectedNode.data.text || ""}
                        onChange={(e) => updateNode({ text: e.target.value })}
                        style={{
                          width: "100%",
                          minHeight: "80px",
                          padding: "12px",
                          background: "#0f172a",
                          border: "1px solid #334155",
                          borderRadius: "8px",
                          color: "white",
                          fontSize: "14px",
                          fontFamily: "inherit",
                          resize: "vertical",
                        }}
                        placeholder="Enter message text..."
                      />
                    </div>

                    <div>
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "8px",
                      }}>
                        <label style={{ fontSize: "12px", fontWeight: 600, color: "#cbd5e1" }}>
                          Buttons
                        </label>
                        <button
                          onClick={() => {
                            const buttons = selectedNode.data.buttons || [];
                            updateNode({ buttons: [...buttons, `Option ${buttons.length + 1}`] });
                          }}
                          style={{
                            background: "#6366f1",
                            border: "none",
                            padding: "4px 12px",
                            borderRadius: "6px",
                            color: "white",
                            fontSize: "11px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <Plus style={{ width: "12px", height: "12px" }} />
                          Add
                        </button>
                      </div>

                      {(selectedNode.data.buttons || []).map((btn: string, i: number) => (
                        <div key={i} style={{
                          display: "flex",
                          gap: "8px",
                          marginBottom: "8px",
                        }}>
                          <input
                            type="text"
                            value={btn}
                            onChange={(e) => {
                              const newButtons = [...(selectedNode.data.buttons || [])];
                              newButtons[i] = e.target.value;
                              updateNode({ buttons: newButtons });
                            }}
                            style={{
                              flex: 1,
                              padding: "10px",
                              background: "#0f172a",
                              border: "1px solid #334155",
                              borderRadius: "8px",
                              color: "white",
                              fontSize: "13px",
                            }}
                          />
                          <button
                            onClick={() => {
                              const newButtons = (selectedNode.data.buttons || []).filter((_: any, idx: number) => idx !== i);
                              updateNode({ buttons: newButtons });
                            }}
                            style={{
                              background: "#ef4444",
                              border: "none",
                              padding: "8px",
                              borderRadius: "6px",
                              color: "white",
                              cursor: "pointer",
                            }}
                          >
                            <Minus style={{ width: "16px", height: "16px" }} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedNode.type === "trigger" && (
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#cbd5e1", marginBottom: "8px" }}>
                      Trigger Type
                    </label>
                    <input
                      type="text"
                      value={selectedNode.data.label || ""}
                      onChange={(e) => updateNode({ label: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "12px",
                        background: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                        color: "white",
                        fontSize: "14px",
                      }}
                      placeholder="on message"
                    />
                  </div>
                )}

                {selectedNode.type === "image" && (
                  <div>
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}>
                      <label style={{ fontSize: "12px", fontWeight: 600, color: "#cbd5e1" }}>
                        Images
                      </label>
                      <button
                        onClick={() => {
                          const images = selectedNode.data.images || [];
                          updateNode({ images: [...images, { url: "", caption: "" }] });
                        }}
                        style={{
                          background: "#8b5cf6",
                          border: "none",
                          padding: "4px 12px",
                          borderRadius: "6px",
                          color: "white",
                          fontSize: "11px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Plus style={{ width: "12px", height: "12px" }} />
                        Add Image
                      </button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      {(selectedNode.data.images || []).map((img: any, i: number) => (
                        <div key={i} style={{
                          background: "rgba(139, 92, 246, 0.05)",
                          border: "1px solid #334155",
                          borderRadius: "8px",
                          padding: "12px",
                          position: "relative"
                        }}>
                          <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "8px"
                          }}>
                            <span style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              color: "#8b5cf6"
                            }}>
                              Image {i + 1}
                            </span>
                            <button
                              onClick={() => {
                                const newImages = (selectedNode.data.images || []).filter((_: any, idx: number) => idx !== i);
                                updateNode({ images: newImages.length > 0 ? newImages : [{ url: "", caption: "" }] });
                              }}
                              style={{
                                background: "#ef4444",
                                border: "none",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                color: "white",
                                cursor: "pointer",
                                fontSize: "11px",
                              }}
                            >
                              <X style={{ width: "12px", height: "12px" }} />
                            </button>
                          </div>

                          <div style={{ marginBottom: "12px" }}>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#cbd5e1", marginBottom: "6px" }}>
                              Image URL
                            </label>
                            <input
                              type="text"
                              value={img.url || ""}
                              onChange={(e) => {
                                const newImages = [...(selectedNode.data.images || [])];
                                newImages[i] = { ...newImages[i], url: e.target.value };
                                updateNode({ images: newImages });
                              }}
                              style={{
                                width: "100%",
                                padding: "10px",
                                background: "#0f172a",
                                border: "1px solid #334155",
                                borderRadius: "6px",
                                color: "white",
                                fontSize: "12px",
                                fontFamily: "'Courier New', monospace",
                              }}
                              placeholder="https://example.com/image.jpg"
                            />
                          </div>

                          <div style={{ marginBottom: "12px" }}>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#cbd5e1", marginBottom: "6px" }}>
                              Or Upload from Computer
                            </label>
                            <label style={{
                              width: "100%",
                              padding: "10px",
                              background: "#0f172a",
                              border: "1px dashed #8b5cf6",
                              borderRadius: "6px",
                              color: "#8b5cf6",
                              fontSize: "12px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "8px",
                              transition: "all 0.2s"
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "rgba(139, 92, 246, 0.1)";
                              e.currentTarget.style.borderColor = "#a78bfa";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "#0f172a";
                              e.currentTarget.style.borderColor = "#8b5cf6";
                            }}
                            >
                              <Upload style={{ width: "14px", height: "14px" }} />
                              {img.fileName || "Choose image file"}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    // Check file size (limit to 5MB)
                                    if (file.size > 5 * 1024 * 1024) {
                                      alert("File size must be less than 5MB");
                                      return;
                                    }
                                    
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      const base64 = event.target?.result as string;
                                      const newImages = [...(selectedNode.data.images || [])];
                                      newImages[i] = { 
                                        ...newImages[i], 
                                        url: base64,
                                        fileName: file.name,
                                        isUploaded: true
                                      };
                                      updateNode({ images: newImages });
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                style={{ display: "none" }}
                              />
                            </label>
                            <p style={{ fontSize: "10px", color: "#64748b", margin: "4px 0 0", fontStyle: "italic" }}>
                              Supports: JPG, PNG, GIF, WebP (Max 5MB)
                            </p>
                          </div>

                          <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#cbd5e1", marginBottom: "6px" }}>
                              Caption (Optional)
                            </label>
                            <textarea
                              value={img.caption || ""}
                              onChange={(e) => {
                                const newImages = [...(selectedNode.data.images || [])];
                                newImages[i] = { ...newImages[i], caption: e.target.value };
                                updateNode({ images: newImages });
                              }}
                              style={{
                                width: "100%",
                                minHeight: "60px",
                                padding: "10px",
                                background: "#0f172a",
                                border: "1px solid #334155",
                                borderRadius: "6px",
                                color: "white",
                                fontSize: "12px",
                                fontFamily: "inherit",
                                resize: "vertical",
                              }}
                              placeholder="Enter image caption..."
                            />
                          </div>

                          {img.isUploaded && (
                            <div style={{
                              marginTop: "8px",
                              padding: "6px 10px",
                              background: "rgba(16, 185, 129, 0.1)",
                              border: "1px solid rgba(16, 185, 129, 0.3)",
                              borderRadius: "4px",
                              fontSize: "10px",
                              color: "#10b981",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px"
                            }}>
                              <span style={{ fontSize: "14px" }}>✓</span>
                              Image uploaded successfully
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </aside>
      </div>

      <style>{`
        .gradient-purple-indigo {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        }
        .gradient-blue-cyan {
          background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
        }
        .gradient-green-emerald {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }
        .gradient-amber-orange {
          background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
        }
        .gradient-pink-rose {
          background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%);
        }
        .gradient-blue-purple {
          background: linear-gradient(135deg, #3b82f6 0%, #a855f7 100%);
        }
        .gradient-purple-pink {
          background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
        }
      `}</style>
    </div>
  );
}

export default function BuilderCanvas({ bot }: any) {
  const demoBot = bot || {
    id: "demo-bot-1",
    name: "Customer Support Bot",
    description: "Automated customer support flow",
    status: "active",
    nodes: [],
    edges: [],
  };

  return (
    <ReactFlowProvider>
      <BuilderCanvasInner bot={demoBot} />
    </ReactFlowProvider>
  );
}