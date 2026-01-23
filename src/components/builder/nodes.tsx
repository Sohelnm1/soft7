"use client";

import React from "react";
import { Handle, Position } from "reactflow";

/* -----------------------------------------------------
   ✅ Shared Node Card UI
----------------------------------------------------- */
export function Card({
  title,
  children,
  gradient,
  icon,
}: {
  title: string;
  children?: React.ReactNode;
  gradient: string;
  icon: string;
}) {
  return (
    <div className="builder-node-card">
      <div className={`builder-node-card-header ${gradient}`}>
        <span>{icon}</span>
        <div className="builder-node-card-title">{title}</div>
      </div>
      <div className="builder-node-card-body">{children}</div>
    </div>
  );
}

/* -----------------------------------------------------
   ✅ TRIGGER NODE
----------------------------------------------------- */
export const TriggerNode = ({ data }: any) => (
  <div>
    <Card 
      title="Trigger" 
      gradient="gradient-purple-indigo"
      icon="⚡"
    >
      <div style={{
        fontSize: '0.75rem',
        fontWeight: 500,
        color: '#cbd5e1',
        background: 'rgba(2, 6, 23, 0.4)',
        padding: '0.25rem 0.5rem',
        borderRadius: '0.25rem'
      }}>
        {data?.label || "On Message"}
      </div>
    </Card>

    <Handle 
      type="source" 
      position={Position.Right} 
      id="out"
      style={{
        width: '12px',
        height: '12px',
        background: '#6366f1',
        border: '2px solid white'
      }}
    />
  </div>
);

/* -----------------------------------------------------
   ✅ MESSAGE NODE (with Image Upload Support)
----------------------------------------------------- */
export const MessageNode = ({ data }: any) => {
  const images = Array.isArray(data?.images) ? data.images : [];
  
  return (
    <div>
      <Handle 
        type="target" 
        position={Position.Left} 
        id="in"
        style={{
          width: '12px',
          height: '12px',
          background: '#3b82f6',
          border: '2px solid white'
        }}
      />

      <Card 
        title="Message" 
        gradient="gradient-blue-cyan"
        icon="💬"
      >
        <div style={{
          background: 'rgba(2, 6, 23, 0.4)',
          padding: '0.5rem 0.75rem',
          borderRadius: '0.5rem'
        }}>
          {/* Text Message */}
          <p style={{ fontSize: '0.875rem', lineHeight: '1.5', margin: 0, marginBottom: images.length > 0 ? '0.5rem' : 0 }}>
            {data?.text || "Hello 👋"}
          </p>

          {/* Images Display */}
          {images.length > 0 && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              marginTop: '0.5rem'
            }}>
              {images.map((img: any, i: number) => (
                <div key={i} style={{
                  background: 'rgba(0, 0, 0, 0.2)',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid rgba(59, 130, 246, 0.3)'
                }}>
                  {img.url ? (
                    <div style={{
                      width: '100%',
                      height: '80px',
                      borderRadius: '0.25rem',
                      overflow: 'hidden',
                      background: '#1e293b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: img.caption ? '0.375rem' : 0
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
                          if ((e.target as HTMLElement).parentElement) {
                            (e.target as HTMLElement).parentElement!.innerHTML = '<span style="color: #94a3b8; font-size: 0.6875rem;">Invalid URL</span>';
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '80px',
                      borderRadius: '0.25rem',
                      background: '#1e293b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px dashed #334155',
                      marginBottom: img.caption ? '0.375rem' : 0
                    }}>
                      <span style={{ fontSize: '1.75rem', opacity: 0.5 }}>🖼️</span>
                    </div>
                  )}
                  {img.caption && (
                    <p style={{
                      fontSize: '0.6875rem',
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
                  fontSize: '0.625rem',
                  color: '#3b82f6',
                  fontWeight: 600,
                  textAlign: 'center',
                  padding: '0.25rem',
                  background: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '0.25rem'
                }}>
                  {images.length} Images
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      <Handle 
        type="source" 
        position={Position.Right} 
        id="out"
        style={{
          width: '12px',
          height: '12px',
          background: '#06b6d4',
          border: '2px solid white'
        }}
      />
    </div>
  );
};

/* -----------------------------------------------------
   ✅ AI NODE
----------------------------------------------------- */
export const AINode = ({ data }: any) => (
  <div>
    <Handle 
      type="target" 
      position={Position.Left} 
      id="in"
      style={{
        width: '12px',
        height: '12px',
        background: '#10b981',
        border: '2px solid white'
      }}
    />

    <Card 
      title="AI Response" 
      gradient="gradient-green-emerald"
      icon="🤖"
    >
      <div style={{
        background: 'rgba(2, 6, 23, 0.4)',
        padding: '0.5rem 0.75rem',
        borderRadius: '0.5rem'
      }}>
        <p style={{
          fontSize: '0.75rem',
          fontFamily: "'Courier New', monospace",
          lineHeight: '1.5',
          color: '#a7f3d0',
          wordBreak: 'break-word',
          margin: 0
        }}>
          {data?.prompt || "AI Response"}
        </p>
      </div>
    </Card>

    <Handle 
      type="source" 
      position={Position.Right} 
      id="out"
      style={{
        width: '12px',
        height: '12px',
        background: '#059669',
        border: '2px solid white'
      }}
    />
  </div>
);

/* -----------------------------------------------------
   ✅ CONDITION NODE (TRUE / FALSE)
----------------------------------------------------- */
export const ConditionNode = ({ data }: any) => (
  <div>
    <Handle 
      type="target" 
      position={Position.Left} 
      id="in"
      style={{
        width: '12px',
        height: '12px',
        background: '#f59e0b',
        border: '2px solid white'
      }}
    />

    <Card 
      title="Condition" 
      gradient="gradient-amber-orange"
      icon="🔀"
    >
      <div style={{
        background: 'rgba(2, 6, 23, 0.4)',
        padding: '0.5rem 0.75rem',
        borderRadius: '0.5rem',
        marginBottom: '0.5rem'
      }}>
        <code style={{
          fontSize: '0.75rem',
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
        gap: '0.5rem',
        fontSize: '0.625rem',
        marginTop: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '9999px',
            background: '#4ade80'
          }}></div>
          <span style={{ color: '#86efac', fontWeight: 600 }}>TRUE</span>
        </div>
        <span style={{ color: '#64748b' }}>|</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '9999px',
            background: '#fbbf24'
          }}></div>
          <span style={{ color: '#fde047', fontWeight: 600 }}>FALSE</span>
        </div>
      </div>
    </Card>

    <Handle
      type="source"
      position={Position.Right}
      id="true"
      style={{
        top: 32,
        width: '12px',
        height: '12px',
        background: '#10b981',
        border: '2px solid white'
      }}
    />

    <Handle
      type="source"
      position={Position.Right}
      id="false"
      style={{
        top: 68,
        width: '12px',
        height: '12px',
        background: '#f59e0b',
        border: '2px solid white'
      }}
    />
  </div>
);

/* -----------------------------------------------------
   ✅ HTTP ACTION NODE
----------------------------------------------------- */
export const ActionNode = ({ data }: any) => (
  <div>
    <Handle 
      type="target" 
      position={Position.Left} 
      id="in"
      style={{
        width: '12px',
        height: '12px',
        background: '#ec4899',
        border: '2px solid white'
      }}
    />

    <Card 
      title="HTTP Request" 
      gradient="gradient-pink-rose"
      icon="🌐"
    >
      <div style={{
        background: 'rgba(2, 6, 23, 0.4)',
        padding: '0.5rem 0.75rem',
        borderRadius: '0.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#f9a8d4',
            background: 'rgba(236, 72, 153, 0.2)',
            padding: '0.125rem 0.5rem',
            borderRadius: '0.25rem'
          }}>
            {data?.method || "POST"}
          </span>
        </div>
        <div style={{
          fontSize: '0.75rem',
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

    <Handle 
      type="source" 
      position={Position.Right} 
      id="out"
      style={{
        width: '12px',
        height: '12px',
        background: '#f43f5e',
        border: '2px solid white'
      }}
    />
  </div>
);

/* -----------------------------------------------------
 ✅ BUTTON MESSAGE NODE
----------------------------------------------------- */
export const ButtonMessageNode = ({ data }: any) => {
  const buttons: string[] = Array.isArray(data?.buttons)
    ? data.buttons
    : ["Option 1"];

  const baseY = 68;
  const gap = 32;

  return (
    <div>
      <Handle 
        type="target" 
        position={Position.Left} 
        id="in"
        style={{
          width: '12px',
          height: '12px',
          background: '#a855f7',
          border: '2px solid white'
        }}
      />

      <Card 
        title="Button Message" 
        gradient="gradient-blue-purple"
        icon="🔘"
      >
        <div style={{
          background: 'rgba(2, 6, 23, 0.4)',
          padding: '0.5rem 0.75rem',
          borderRadius: '0.5rem',
          marginBottom: '0.5rem'
        }}>
          <p style={{ fontSize: '0.875rem', color: '#e2e8f0', margin: 0 }}>
            {data?.text || "Choose an option:"}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {buttons.map((btn, i) => (
            <div
              key={i}
              style={{
                background: 'linear-gradient(to right, #6366f1, #a855f7)',
                color: 'white',
                padding: '0.375rem 0.75rem',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                fontWeight: 500,
                textAlign: 'center',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            >
              {btn}
            </div>
          ))}
        </div>
      </Card>

      {buttons.map((btn, i) => (
        <Handle
          key={i}
          id={`btn_${i}`}
          type="source"
          position={Position.Right}
          title={btn}
          style={{
            top: baseY + i * gap,
            width: '12px',
            height: '12px',
            background: '#a855f7',
            border: '2px solid white'
          }}
        />
      ))}
    </div>
  );
};

/* -----------------------------------------------------
   ✅ IMAGE NODE (with Multiple Images Support)
----------------------------------------------------- */
export const ImageNode = ({ data }: any) => {
  const images = Array.isArray(data?.images) ? data.images : [{ url: "", caption: "" }];
  
  return (
    <div>
      <Handle 
        type="target" 
        position={Position.Left} 
        id="in"
        style={{
          width: '12px',
          height: '12px',
          background: '#8b5cf6',
          border: '2px solid white'
        }}
      />

      <Card 
        title="Image" 
        gradient="gradient-purple-pink"
        icon="🖼️"
      >
        <div style={{
          background: 'rgba(2, 6, 23, 0.4)',
          padding: '0.5rem 0.75rem',
          borderRadius: '0.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          {images.map((img: any, i: number) => (
            <div key={i} style={{
              background: 'rgba(0, 0, 0, 0.2)',
              padding: '0.5rem',
              borderRadius: '0.375rem',
              border: '1px solid rgba(139, 92, 246, 0.3)'
            }}>
              {img.url ? (
                <div style={{
                  width: '100%',
                  height: '80px',
                  borderRadius: '0.25rem',
                  overflow: 'hidden',
                  background: '#1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: img.caption ? '0.375rem' : 0
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
                      if ((e.target as HTMLElement).parentElement) {
                        (e.target as HTMLElement).parentElement!.innerHTML = '<span style="color: #94a3b8; font-size: 0.6875rem;">Invalid URL</span>';
                      }
                    }}
                  />
                </div>
              ) : (
                <div style={{
                  width: '100%',
                  height: '80px',
                  borderRadius: '0.25rem',
                  background: '#1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px dashed #334155',
                  marginBottom: img.caption ? '0.375rem' : 0
                }}>
                  <span style={{ fontSize: '1.75rem', opacity: 0.5 }}>🖼️</span>
                </div>
              )}
              {img.caption && (
                <p style={{
                  fontSize: '0.6875rem',
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
              fontSize: '0.625rem',
              color: '#8b5cf6',
              fontWeight: 600,
              textAlign: 'center',
              padding: '0.25rem',
              background: 'rgba(139, 92, 246, 0.1)',
              borderRadius: '0.25rem'
            }}>
              {images.length} Images
            </div>
          )}
        </div>
      </Card>

      <Handle 
        type="source" 
        position={Position.Right} 
        id="out"
        style={{
          width: '12px',
          height: '12px',
          background: '#7c3aed',
          border: '2px solid white'
        }}
      />
    </div>
  );
};

/* -----------------------------------------------------
   ✅ NODE MAP
----------------------------------------------------- */
export const nodeTypes = {
  trigger: TriggerNode,
  message: MessageNode,
  ai: AINode,
  condition: ConditionNode,
  action: ActionNode,
  buttonMessage: ButtonMessageNode,
  image: ImageNode,
} as const;

/* -----------------------------------------------------
   ✅ CONNECTION RULES
----------------------------------------------------- */
export function canConnect(
  sourceType?: string,
  targetType?: string,
  sourceHandle?: string
) {
  if (!sourceType || !targetType) return false;

  if (targetType === "trigger") return false;

  if (sourceType === "condition") {
    if (!["true", "false"].includes(sourceHandle || "")) return false;
    return true;
  }

  if (sourceType === "buttonMessage") {
    if (!sourceHandle?.startsWith("btn_")) return false;
    return true;
  }

  return true;
}

/* -----------------------------------------------------
   ✅ DEFAULT NODE DATA
----------------------------------------------------- */
export function getDefaultData(type: string) {
  switch (type) {
    case "message": 
      return { text: "Hello!", images: [] };
    case "ai": 
      return { prompt: "Answer politely." };
    case "condition": 
      return { expr: `includes(text,"hi")` };
    case "action": 
      return { url: "https://example.com", method: "POST", body: "{}" };
    case "buttonMessage": 
      return { text: "Choose:", buttons: ["Option 1", "Option 2"] };
    case "image": 
      return { images: [{ url: "", caption: "" }] };
    case "trigger": 
      return { label: "on message" };
    default: 
      return {};
  }
}