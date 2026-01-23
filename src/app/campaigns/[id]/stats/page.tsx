"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, Search, RefreshCw } from "lucide-react";

type MessageStatus = "pending" | "sent" | "delivered" | "read" | "failed";

type CampaignStats = {
    totalContacts: number;
    sentCount: number;
    deliveredCount: number;
    failedCount: number;
    readCount: number;
};

type Message = {
    id: string;
    contactId: number;
    contactName: string;
    contactPhone: string;
    status: MessageStatus;
    createdAt: string;
    errorMessage?: string;
    errorCode?: string;
    error?: string;
    templateName?: string;
    conversationId: string;
    whatsappMessageId?: string;
};

type CampaignData = {
    id: string;
    name: string;
    status: string;
    type: string;
    startDate: string | null;
    createdAt: string;
};

export default function CampaignStatsPage() {
    const params = useParams();
    const router = useRouter();
    const campaignId = params.id as string;

    const [campaign, setCampaign] = useState<CampaignData | null>(null);
    const [stats, setStats] = useState<CampaignStats | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");

    const fetchStats = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter !== "all") params.set("status", statusFilter);
            if (searchQuery) params.set("search", searchQuery);

            const res = await fetch(`/api/campaigns/${campaignId}/stats?${params}`);
            const data = await res.json();

            if (res.ok) {
                setCampaign(data.campaign);
                setStats(data.stats);
                setMessages(data.messages);
            } else {
                console.error("Failed to fetch stats:", data.error);
            }
        } catch (err) {
            console.error("Error fetching stats:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [campaignId, statusFilter, searchQuery]);

    const getStatusColor = (status: MessageStatus) => {
        switch (status) {
            case "sent":
                return "text-blue-600 bg-blue-50 border-blue-200";
            case "delivered":
                return "text-green-600 bg-green-50 border-green-200";
            case "read":
                return "text-purple-600 bg-purple-50 border-purple-200";
            case "failed":
                return "text-red-600 bg-red-50 border-red-200";
            default:
                return "text-gray-600 bg-gray-50 border-gray-200";
        }
    };

    const getStatusIcon = (status: MessageStatus) => {
        switch (status) {
            case "sent":
                return "✓";
            case "delivered":
                return "✓✓";
            case "read":
                return "✓✓";
            case "failed":
                return "✗";
            default:
                return "○";
        }
    };

    const calculateSuccessRate = () => {
        if (!stats) return 0;
        const total = stats.totalContacts;
        if (total === 0) return 0;
        const successful = stats.sentCount + stats.deliveredCount + stats.readCount;
        return ((successful / total) * 100).toFixed(1);
    };

    if (loading && !campaign) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-gray-600 dark:text-gray-400">Loading campaign stats...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.push("/campaigns")}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Campaigns
                    </button>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                {campaign?.name}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Campaign Analytics & Message Logs
                            </p>
                        </div>
                        <button
                            onClick={fetchStats}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Stats Overview Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Contacts</div>
                            <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                {stats.totalContacts}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-blue-200 dark:border-blue-900">
                            <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Sent</div>
                            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                {stats.sentCount}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-green-200 dark:border-green-900">
                            <div className="text-sm text-green-600 dark:text-green-400 mb-1">Delivered</div>
                            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                                {stats.deliveredCount}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-red-200 dark:border-red-900">
                            <div className="text-sm text-red-600 dark:text-red-400 mb-1">Failed</div>
                            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                                {stats.failedCount}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-purple-200 dark:border-purple-900">
                            <div className="text-sm text-purple-600 dark:text-purple-400 mb-1">Read</div>
                            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                                {stats.readCount}
                            </div>
                        </div>
                    </div>
                )}

                {/* Progress Bar */}
                {stats && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Campaign Progress
                            </h3>
                            <span className="text-2xl font-bold text-green-600">
                                {calculateSuccessRate()}% Success
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                            <div className="h-full flex">
                                <div
                                    className="bg-blue-500"
                                    style={{
                                        width: `${(stats.sentCount / stats.totalContacts) * 100}%`,
                                    }}
                                    title={`Sent: ${stats.sentCount}`}
                                />
                                <div
                                    className="bg-green-500"
                                    style={{
                                        width: `${(stats.deliveredCount / stats.totalContacts) * 100}%`,
                                    }}
                                    title={`Delivered: ${stats.deliveredCount}`}
                                />
                                <div
                                    className="bg-purple-500"
                                    style={{
                                        width: `${(stats.readCount / stats.totalContacts) * 100}%`,
                                    }}
                                    title={`Read: ${stats.readCount}`}
                                />
                                <div
                                    className="bg-red-500"
                                    style={{
                                        width: `${(stats.failedCount / stats.totalContacts) * 100}%`,
                                    }}
                                    title={`Failed: ${stats.failedCount}`}
                                />
                            </div>
                        </div>
                        <div className="flex gap-4 mt-3 text-sm">
                            <span className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                                Sent
                            </span>
                            <span className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-green-500 rounded"></div>
                                Delivered
                            </span>
                            <span className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-purple-500 rounded"></div>
                                Read
                            </span>
                            <span className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-red-500 rounded"></div>
                                Failed
                            </span>
                        </div>
                    </div>
                )}

                {/* Filters and Search */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Status Filter Tabs */}
                        <div className="flex gap-2 flex-wrap">
                            {["all", "sent", "delivered", "failed", "read"].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-4 py-2 rounded-lg font-medium transition ${statusFilter === status
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                        }`}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by contact name or phone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>

                {/* Message Logs Table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Contact
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Time
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Details
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                            Loading messages...
                                        </td>
                                    </tr>
                                ) : messages.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                            No messages found
                                        </td>
                                    </tr>
                                ) : (
                                    messages.map((msg) => (
                                        <tr key={msg.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {msg.contactName}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {msg.contactPhone}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                                        msg.status
                                                    )}`}
                                                >
                                                    {getStatusIcon(msg.status)} {msg.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {new Date(msg.createdAt).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                {msg.status === "failed" && msg.errorMessage ? (
                                                    <div className="text-sm">
                                                        <div className="text-red-600 dark:text-red-400 font-medium">
                                                            Error: {msg.errorMessage}
                                                        </div>
                                                        {msg.errorCode && (
                                                            <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                                                                Code: {msg.errorCode}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        Template: {msg.templateName || "N/A"}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <button
                                                    onClick={() => router.push(`/inbox?conversation=${msg.conversationId}`)}
                                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                                                >
                                                    View Chat
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
