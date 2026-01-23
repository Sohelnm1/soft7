// WA_Dashboard-main/src/app/dashboard/page.tsx

'use client';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Chart } from '@/components/chart';
import { ContactPieChart } from '@/components/piechart';
import { LeadSourcesBreakdown } from '@/components/active';
import '../dashboard.css';
import {
  SendIcon,
  ReceiveIcon,
  UsersIcon,
  UserIcon,
  BarChartIcon,
  LineChartIcon,
  ClockIcon,
  CheckIcon,
  SourceIcon,
} from '@/components/dashboard-icons';

interface LeadData {
  createdAt: string;
  _count: { id: number };
}

interface SourceData {
  source: string | null;
  _count: { id: number };
}

interface ContactSourceData {
  source: string | null;
  _count: { id: number };
}

interface RecentMessage {
  id: number;
  content: string;
  sentBy: string;
  createdAt: string;
  contact: {
    id: number;
    name: string;
    source: string | null;
  };
}

interface ContactStatusBreakdown {
  status: string | null;
  _count: { id: number };
}

interface ContactBySource {
  source: string | null;
  status: string | null;
  _count: { id: number };
}

interface MonthlyMessageData {
  [month: string]: { sent: number; received: number };
}

interface DailyMessageData {
  [day: string]: { sent: number; received: number };
}

interface YearlyMessageData {
  [year: string]: { sent: number; received: number };
}

type TrendType = 'increasing' | 'decreasing' | 'stable';

interface DashboardData {
  totalMessagesSent: number;
  totalMessagesReceived: number;
  totalContacts: number;
  teamAgents: number;
  messagesSentChange: string;
  messagesReceivedChange: string;
  contactsChange: string;
  teamAgentsChange: string;
  messagesSentTrend: TrendType;
  messagesReceivedTrend: TrendType;
  contactsTrend: TrendType;
  teamAgentsTrend: TrendType;
  leads: LeadData[];
  sources: SourceData[];
  contactsBySource: ContactSourceData[];
  contactStatusBreakdown: ContactStatusBreakdown[];
  recentMessages: RecentMessage[];
  contactsBySourceAndStatus: ContactBySource[];
  dailyMessageData: DailyMessageData;
  monthlyMessageData: MonthlyMessageData;
  yearlyMessageData: YearlyMessageData;
}

interface MetricCardData {
  title: string;
  value: string;
  change: string;
  trend: TrendType;
  color: string;
  icon: string;
}

const MAIN_SOURCES = ['instagram', 'facebook', 'whatsapp', 'website'];
const CHART_COLORS = ['#10B981', '#6ee7b7', '#34d399', '#059669', '#a7f3d0', '#d1fae5'];
const PRIMARY_ACCENT = '#10B981';
const SECONDARY_ACCENT = '#6ee7b7';

const TrendLine = ({ trend }: { trend: TrendType }) => {
  if (trend === 'increasing') {
    return (
      <svg width="40" height="24" viewBox="0 0 40 24" fill="none" className="inline-block ml-2">
        <path d="M2 22 L15 12 L25 14 L38 2" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M32 2 L38 2 L38 8" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  } else if (trend === 'decreasing') {
    return (
      <svg width="40" height="24" viewBox="0 0 40 24" fill="none" className="inline-block ml-2">
        <path d="M2 2 L15 12 L25 10 L38 22" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M32 22 L38 22 L38 16" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  } else {
    return (
      <svg width="40" height="24" viewBox="0 0 40 24" fill="none" className="inline-block ml-2">
        <path d="M2 12 L38 12" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 4"/>
      </svg>
    );
  }
};

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [messageTimeframe, setMessageTimeframe] = useState<'day' | 'month' | 'year'>('day');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/dashboard', {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (res.status === 401) {
          router.replace('/auth');
          return;
        }
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
        }
        const result: DashboardData = await res.json();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [router]);

  const getSourceIcon = useCallback((source: string | null) => {
    return <SourceIcon source={source || ''} size={24} color="#10B981" />;
  }, []);

  const pieChartData = useMemo(() => {
    if (!data?.contactsBySource) return null;
    const labels = data.contactsBySource.filter(s => s.source && s._count.id > 0).map(s => s.source || 'Unknown');
    const values = data.contactsBySource.filter(s => s.source && s._count.id > 0).map(s => s._count.id);
    if (labels.length === 0) return null;
    return {
      labels,
      datasets: [{
        data: values,
        backgroundColor: CHART_COLORS,
        hoverOffset: 10,
        borderWidth: 2,
        borderColor: '#fff',
      }],
    };
  }, [data?.contactsBySource]);

  const chartData = useMemo(() => {
    if (!data?.leads) return null;
    const groupedByDate: Record<string, number> = {};
    data.leads.forEach((lead) => {
      const date = new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      groupedByDate[date] = (groupedByDate[date] || 0) + lead._count.id;
    });
    const labels = Object.keys(groupedByDate);
    const newLeadsData = Object.values(groupedByDate);
    const conversionsData = newLeadsData.map(l => Math.floor(l * (0.5 + Math.random() * 0.2)));
    return {
      labels,
      datasets: [
        {
          label: 'New Leads',
          data: newLeadsData,
          borderColor: SECONDARY_ACCENT,
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 7,
          fill: true,
        },
        {
          label: 'Conversions',
          data: conversionsData,
          borderColor: PRIMARY_ACCENT,
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 7,
          fill: true,
        },
      ],
    };
  }, [data?.leads]);

  const leadAnalytics = useMemo(() => {
    if (!data?.contactsBySourceAndStatus) return { totalLeads: 0, pendingLeads: 0, assignedLeads: 0 };
    const totalLeads = data.contactsBySourceAndStatus.reduce((acc, c) => acc + c._count.id, 0);
    const pendingLeads = data.contactsBySourceAndStatus.filter(c => c.status?.toLowerCase() === 'pending').reduce((acc, c) => acc + c._count.id, 0);
    const assignedLeads = data.contactsBySourceAndStatus.filter(c => ['assigned', 'completed', 'active'].includes(c.status?.toLowerCase() || '')).reduce((acc, c) => acc + c._count.id, 0);
    return { totalLeads, pendingLeads, assignedLeads };
  }, [data?.contactsBySourceAndStatus]);

  const processedSourcesData = useMemo(() => {
    if (!data?.contactsBySourceAndStatus) return [];
    const sourceMap = new Map<string, { total: number; pending: number; assigned: number }>();
    data.contactsBySourceAndStatus.forEach((item) => {
      if (!item.source) return;
      const normalizedSource = item.source.toLowerCase();
      if (!sourceMap.has(normalizedSource)) sourceMap.set(normalizedSource, { total: 0, pending: 0, assigned: 0 });
      const sourceData = sourceMap.get(normalizedSource)!;
      const count = item._count.id;
      sourceData.total += count;
      const normalizedStatus = item.status?.toLowerCase();
      if (normalizedStatus === 'pending') sourceData.pending += count;
      else if (['assigned', 'completed', 'active'].includes(normalizedStatus || '')) sourceData.assigned += count;
    });
    const mainSources = MAIN_SOURCES.map(sourceName => {
      const existingData = sourceMap.get(sourceName);
      const displayName = sourceName.charAt(0).toUpperCase() + sourceName.slice(1);
      return {
        sourceName: displayName,
        sourceKey: sourceName,
        totalCount: existingData?.total || 0,
        pending: existingData?.pending || 0,
        assigned: existingData?.assigned || 0,
      };
    });
    return mainSources.sort((a, b) => b.totalCount - a.totalCount);
  }, [data?.contactsBySourceAndStatus]);

  const metricCards: MetricCardData[] = useMemo(() => {
    if (!data) return [];
    return [
      {
        title: 'Total Messages Sent',
        value: data.totalMessagesSent.toLocaleString(),
        change: data.messagesSentChange,
        trend: data.messagesSentTrend,
        color: 'text-green-600',
        icon: '📤',
      },
      {
        title: 'Total Messages Received',
        value: data.totalMessagesReceived.toLocaleString(),
        change: data.messagesReceivedChange,
        trend: data.messagesReceivedTrend,
        color: 'text-green-600',
        icon: '📥',
      },
      {
        title: 'Active Contacts',
        value: data.totalContacts.toLocaleString(),
        change: data.contactsChange,
        trend: data.contactsTrend,
        color: 'text-green-600',
        icon: '👥',
      },
      {
        title: 'Team Agents',
        value: data.teamAgents.toString(),
        change: data.teamAgentsChange,
        trend: data.teamAgentsTrend,
        color: 'text-green-600',
        icon: '👤',
      },
    ];
  }, [data]);

  const messageActivityData = useMemo(() => {
    if (!data) return [];
    const now = new Date();
    let labels: string[] = [];
    let sourceData: Record<string, { sent: number; received: number }> = {};
    if (messageTimeframe === 'day') {
      sourceData = data.dailyMessageData || {};
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
      }
    } else if (messageTimeframe === 'month') {
      sourceData = data.monthlyMessageData || {};
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(date.toLocaleString('en-US', { month: 'short' }));
      }
    } else if (messageTimeframe === 'year') {
      sourceData = data.yearlyMessageData || {};
      for (let i = 4; i >= 0; i--) {
        labels.push((now.getFullYear() - i).toString());
      }
    }
    return labels.map(label => ({
      label,
      sent: sourceData[label]?.sent || 0,
      received: sourceData[label]?.received || 0,
    }));
  }, [data, messageTimeframe]);

  const handleSourceClick = (sourceName: string) => {
    router.push(`/contacts?source=${sourceName.toLowerCase()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent mb-4 icon-spin"></div>
          <p className="text-lg text-green-700 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-200 max-w-md">
          <div className="text-red-500 text-5xl mb-4 text-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">Error Loading Dashboard</h2>
          <p className="text-red-600 text-center mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors btn-sparkle sparkle-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8 dashboard-container">
      <div className="metric-row">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-green-900">
            Analytics Dashboard
          </h1>
          <h2 className="text-xl font-extrabold tracking-tight text-green-700 mt-2">
            Track your contact engagement and lead generation performance
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-8 metric-row">
        {metricCards.map((card, index) => (
          <div
            key={card.title}
            className="bg-white p-6 rounded-2xl shadow-lg border border-green-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 metric-card dashboard-card-animated sparkle-button"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-3xl text-green-600">
                {card.title.includes('Sent') && <SendIcon size={32} color="#10B981" />}
                {card.title.includes('Received') && <ReceiveIcon size={32} color="#10B981" />}
                {card.title.includes('Contacts') && <UsersIcon size={32} color="#10B981" />}
                {card.title.includes('Agents') && <UserIcon size={32} color="#10B981" />}
              </div>
              <div className="flex items-center gap-1">
                <span
                  className={`text-sm font-semibold ${
                    card.change.startsWith('+')
                      ? 'text-green-600'
                      : card.change.startsWith('-')
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}
                >
                  {card.change}
                </span>
                <TrendLine trend={card.trend} />
              </div>
            </div>
            <h3 className="text-green-700 text-sm font-medium mb-1">{card.title}</h3>
            <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-green-500 mt-2">
              {card.trend === 'increasing' && '↑ Up from yesterday'}
              {card.trend === 'decreasing' && '↓ Down from yesterday'}
              {card.trend === 'stable' && '→ Same as yesterday'}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 content-section">
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-green-200 hover:shadow-2xl transition-all duration-500 dashboard-card-animated">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-green-900 flex items-center gap-2">
                  <LineChartIcon size={28} color="#10B981" />
                  Leads Analytics
                </h2>
                <span className="px-3 py-1 bg-gradient-to-r from-green-100 to-teal-100 text-green-700 rounded-full text-sm font-semibold">
                  {leadAnalytics.totalLeads} Total
                </span>
              </div>
              <div className="flex gap-2 bg-green-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all sparkle-button ${
                    viewMode === 'list' ? 'bg-white text-green-900 shadow-sm' : 'text-green-700 hover:text-green-900'
                  }`}
                >
                  ☰ List
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all sparkle-button ${
                    viewMode === 'grid' ? 'bg-white text-green-900 shadow-sm' : 'text-green-700 hover:text-green-900'
                  }`}
                >
                  ⊞ Grid
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 stagger-list">
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-300 hover-lift dashboard-card-animated sparkle-button">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 mb-1 font-medium">Total Leads</p>
                    <p className="text-3xl font-bold text-green-900">{leadAnalytics.totalLeads}</p>
                  </div>
                  <div className="text-4xl text-green-600">
                    <BarChartIcon size={32} color="#10B981" />
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200 hover-lift dashboard-card-animated sparkle-button">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-600 mb-1 font-medium">Pending</p>
                    <p className="text-3xl font-bold text-amber-600">{leadAnalytics.pendingLeads}</p>
                  </div>
                  <div className="text-4xl text-amber-600">
                    <ClockIcon size={32} color="#D97706" />
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200 hover-lift dashboard-card-animated sparkle-button">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 mb-1 font-medium">Assigned</p>
                    <p className="text-3xl font-bold text-green-700">{leadAnalytics.assignedLeads}</p>
                  </div>
                  <div className="text-4xl text-green-600">
                    <CheckIcon size={32} color="#059669" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-green-900">Lead Source Breakdown</h3>
                <span className="text-sm text-green-600 bg-green-100 px-3 py-1 rounded-full">
                  {processedSourcesData.length} Sources
                </span>
              </div>

              {viewMode === 'list' ? (
                <div className="space-y-3">
                  {processedSourcesData.map((source, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSourceClick(source.sourceKey)}
                      className="
w-full 
bg-white dark:bg-slate-900
p-5 rounded-xl 
border border-slate-200 dark:border-slate-700
hover:bg-slate-50 dark:hover:bg-slate-800
hover:shadow-lg 
transition-all duration-300 
text-left
"
 >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-md border border-green-100">
                            {getSourceIcon(source.sourceName)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-green-900 text-lg mb-1">{source.sourceName}</h4>
                            <p className="text-sm text-green-600">{source.totalCount} total leads</p>
                          </div>
                        </div>
                        <div className="flex gap-8">
                          <div className="text-center">
                            <p className="text-xs text-green-600 mb-1">📊 Total</p>
                            <p className="text-2xl font-bold text-green-700">{source.totalCount}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-amber-600 mb-1">⏳ Pending</p>
                            <p className="text-2xl font-bold text-amber-600">{source.pending}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-green-600 mb-1">✓ Assigned</p>
                            <p className="text-2xl font-bold text-green-700">{source.assigned}</p>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {processedSourcesData.map((source, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSourceClick(source.sourceKey)}
                      className="bg-gradient-to-br from-green-50 to-white p-5 rounded-xl border border-green-200 hover:shadow-lg hover:border-green-400 transition-all duration-300 text-left"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-md border border-green-100">
                          {getSourceIcon(source.sourceName)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-green-900">{source.sourceName}</h4>
                          <p className="text-2xl font-bold text-green-700">{source.totalCount}</p>
                        </div>
                      </div>
                      <div className="space-y-2 pt-3 border-t border-green-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-green-600">📊 Total</span>
                          <span className="font-semibold text-green-700">{source.totalCount}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-amber-600">⏳ Pending</span>
                          <span className="font-semibold text-amber-600">{source.pending}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-green-600">✓ Assigned</span>
                          <span className="font-semibold text-green-700">{source.assigned}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-green-200 hover:shadow-2xl transition-all duration-500">
            <h2 className="text-xl font-bold mb-4 flex items-center text-green-900">
              <span className="mr-2 text-2xl">🌐</span>
              Source Distribution
            </h2>
            <div className="h-80 flex items-center justify-center">
              {pieChartData ? (
                <ContactPieChart data={pieChartData} />
              ) : (
                <p className="text-green-600">No source data available</p>
              )}
            </div>
            <p className="text-center text-sm text-green-600 mt-4">Total contacts by source</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-green-200 hover:shadow-2xl transition-all duration-500">
          <h2 className="text-xl font-bold mb-4 flex items-center text-green-900">
            <span className="mr-2 text-2xl">📈</span>
            Leads & Conversions
          </h2>
          <div className="h-80">
            {chartData ? <Chart data={chartData} /> : <div className="flex items-center justify-center h-full text-green-600">No lead data available</div>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-xl border border-green-200 hover:shadow-2xl transition-all duration-500">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-green-900">Message Activity</h2>
              <p className="text-sm text-green-600 mt-1">Sent vs received messages</p>
            </div>
            <div className="relative">
              <select
                value={messageTimeframe}
                onChange={(e) => setMessageTimeframe(e.target.value as 'day' | 'month' | 'year')}
                className="appearance-none bg-white border border-green-300 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-green-700 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent cursor-pointer shadow-sm"
              >
                <option value="day">📅 Day</option>
                <option value="month">📆 Month</option>
                <option value="year">📊 Year</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-green-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="h-72 flex items-end justify-around gap-3 px-4">
            {messageActivityData.map((item) => {
              const maxValue = Math.max(...messageActivityData.map(d => Math.max(d.sent, d.received)), 1);
              const sentHeight = Math.max((item.sent / maxValue) * 100, 2);
              const receivedHeight = Math.max((item.received / maxValue) * 100, 2);
              return (
                <div key={item.label} className="flex-1 flex flex-col items-center gap-2 max-w-[80px]">
                  <div className="flex gap-2 items-end h-48 w-full">
                    <div
                      className="bg-green-400 rounded-t-lg flex-1 transition-all hover:bg-green-500 cursor-pointer shadow-md"
                      style={{ height: `${sentHeight}%` }}
                      title={`Sent: ${item.sent}`}
                    />
                    <div
                      className="bg-teal-600 rounded-t-lg flex-1 transition-all hover:bg-teal-700 cursor-pointer shadow-md"
                      style={{ height: `${receivedHeight}%` }}
                      title={`Received: ${item.received}`}
                    />
                  </div>
                  <span className="text-xs text-green-600 font-medium">{item.label}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-green-200">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gradient-to-t from-green-600 to-green-400 rounded" />
              <span className="text-sm text-green-600">Sent ({data.totalMessagesSent})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gradient-to-t from-teal-700 to-teal-600 rounded" />
              <span className="text-sm text-green-600">Received ({data.totalMessagesReceived})</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-xl border border-green-200 hover:shadow-2xl transition-all duration-500">
        <h2 className="text-xl font-bold mb-4 text-green-900 flex items-center gap-2">
          <span>📋</span>
          Recent Activity & Breakdown
        </h2>
        <LeadSourcesBreakdown />
      </div>
    </div>
  );
}