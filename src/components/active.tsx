"use client";

import { useEffect, useState } from "react";

interface LeadSource {
  source: string;
  leads: number;
  conversionRate: number;
  lastActivity: string;
}

export function LeadSourcesBreakdown() {
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeadSources = async () => {
      try {
        const res = await fetch("/api/dashboard", {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const data = await res.json();

        const sourceMap = new Map<string, LeadSource>();

        // First pass: Build the source map with normalized keys
        if (data.contactsBySourceAndStatus) {
          data.contactsBySourceAndStatus.forEach(
            (item: {
              source: string | null;
              status: string | null;
              _count: { id: number };
            }) => {
              if (!item.source) return;

              // Normalize source name (trim and handle case variations)
              const rawSource = item.source.trim();
              const sourceLower = rawSource.toLowerCase();
              
              // Capitalize first letter: Instagram, Facebook, etc.
              const capitalizedSource = rawSource.charAt(0).toUpperCase() + rawSource.slice(1).toLowerCase();
              
              // Find existing source in map (case-insensitive)
              let existingKey = capitalizedSource;
              for (const [key] of sourceMap) {
                if (key.toLowerCase() === sourceLower) {
                  existingKey = key;
                  break;
                }
              }
              
              if (!sourceMap.has(existingKey)) {
                sourceMap.set(existingKey, {
                  source: existingKey,
                  leads: 0,
                  conversionRate: 0,
                  lastActivity: "N/A",
                });
              }

              const sourceData = sourceMap.get(existingKey)!;
              sourceData.leads += item._count.id;
            }
          );
        }

        // Second pass: Calculate conversion rates
        if (data.contactsBySourceAndStatus) {
          const sourceAssigned = new Map<string, number>();

          data.contactsBySourceAndStatus.forEach(
            (item: {
              source: string | null;
              status: string | null;
              _count: { id: number };
            }) => {
              if (item.source) {
                // Normalize source name
                const rawSource = item.source.trim();
                const sourceLower = rawSource.toLowerCase();
                
                // Find existing source key (case-insensitive)
                let existingKey = rawSource.charAt(0).toUpperCase() + rawSource.slice(1).toLowerCase();
                for (const [key] of sourceMap) {
                  if (key.toLowerCase() === sourceLower) {
                    existingKey = key;
                    break;
                  }
                }
                
                // Normalize status for comparison
                const normalizedStatus = item.status?.toLowerCase().trim();
                if (
                  normalizedStatus === "assigned" ||
                  normalizedStatus === "completed"
                ) {
                  const current = sourceAssigned.get(existingKey) || 0;
                  sourceAssigned.set(existingKey, current + item._count.id);
                }
              }
            }
          );

          sourceMap.forEach((sourceData, source) => {
            const assigned = sourceAssigned.get(source) || 0;
            const total = sourceData.leads;
            sourceData.conversionRate =
              total > 0 ? Math.round((assigned / total) * 100) : 0;
          });
        }

        // Third pass: Get last activity timestamps
        if (data.recentMessages && data.recentMessages.length > 0) {
          const messagesBySource = new Map<string, Date>();

          data.recentMessages.forEach(
            (msg: {
              contact: { source: string | null };
              createdAt: string;
            }) => {
              const sourceRaw = msg.contact.source;
              if (sourceRaw) {
                // Normalize source name
                const rawSource = sourceRaw.trim();
                const sourceLower = rawSource.toLowerCase();
                
                // Find existing source key (case-insensitive)
                let existingKey = rawSource.charAt(0).toUpperCase() + rawSource.slice(1).toLowerCase();
                for (const [key] of sourceMap) {
                  if (key.toLowerCase() === sourceLower) {
                    existingKey = key;
                    break;
                  }
                }
                
                const msgDate = new Date(msg.createdAt);
                const currentDate = messagesBySource.get(existingKey);

                if (!currentDate || msgDate > currentDate) {
                  messagesBySource.set(existingKey, msgDate);
                }
              }
            }
          );

          sourceMap.forEach((sourceData, source) => {
            const lastDate = messagesBySource.get(source);
            if (lastDate) {
              const now = new Date();
              const diffMs = now.getTime() - lastDate.getTime();
              const diffMins = Math.floor(diffMs / 60000);
              const diffHours = Math.floor(diffMs / 3600000);
              const diffDays = Math.floor(diffMs / 86400000);

              if (diffMins < 1) {
                sourceData.lastActivity = "just now";
              } else if (diffMins < 60) {
                sourceData.lastActivity = `${diffMins} min ago`;
              } else if (diffHours < 24) {
                sourceData.lastActivity = `${diffHours} hour${
                  diffHours > 1 ? "s" : ""
                } ago`;
              } else if (diffDays === 1) {
                sourceData.lastActivity = "Yesterday";
              } else if (diffDays < 7) {
                sourceData.lastActivity = `${diffDays} days ago`;
              } else {
                sourceData.lastActivity = lastDate.toLocaleDateString();
              }
            }
          });
        }

        const sortedSources = Array.from(sourceMap.values()).sort(
          (a, b) => b.leads - a.leads
        );

        setLeadSources(sortedSources);
        setError(null);
      } catch (err) {
        console.error("Error fetching lead sources:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load lead sources"
        );
        setLeadSources([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeadSources();
  }, []);

  const getSourceColor = (source: string): string => {
    const sourceLower = source.toLowerCase();
    const colorMap: Record<string, string> = {
      website: "#3B82F6",
      email: "#10B981",
      "social media": "#EAB308",
      referral: "#EF4444",
      instagram: "#EC4899",
      facebook: "#2563EB",
      whatsapp: "#16A34A",
      form: "#A855F7",
      import: "#6366F1",
      linkedin: "#1E40AF",
    };
    return colorMap[sourceLower] || "#6B7280";
  };

  const getProgressBarColor = (rate: number): string => {
    if (rate > 50) return "#10b981";
    if (rate > 25) return "#f59e0b";
    return "#ef4444";
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-3"></div>
          <p className="text-gray-500 text-sm">Loading lead sources...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-center bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-600 font-medium">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900">Lead Sources Breakdown</h3>
      </div>

      {leadSources.length === 0 ? (
        <div className="flex justify-center py-12">
          <p className="text-gray-500">No lead sources available</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                  Source
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                  Leads
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                  Conversion Rate
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                  Last Activity
                </th>
              </tr>
            </thead>
            <tbody>
              {leadSources.map((lead, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-5 px-6">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getSourceColor(lead.source) }}
                      />
                      <span className="text-gray-900 font-medium text-base">
                        {lead.source}
                      </span>
                    </div>
                  </td>

                  <td className="py-5 px-6">
                    <span className="text-gray-900 font-bold text-lg">
                      {lead.leads}
                    </span>
                  </td>

                  <td className="py-5 px-6">
                    <div className="flex flex-col gap-2">
                      <div className="w-40 bg-gray-200 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${lead.conversionRate}%`,
                            backgroundColor: getProgressBarColor(lead.conversionRate),
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-600">
                        {lead.conversionRate}%
                      </span>
                    </div>
                  </td>

                  <td className="py-5 px-6">
                    <span className="text-gray-500 text-sm">
                      {lead.lastActivity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}