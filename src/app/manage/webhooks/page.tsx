"use client";

import { useState, useEffect } from "react";
import {
    Pencil, PlusCircle, Info, Settings, Zap,
    Webhook, BookOpen, Loader2,
    CheckSquare, Square, Save, XCircle, CheckCircle, Bell, Clock, Eye, History // Added icons for Logs
} from "lucide-react";
import { format } from "date-fns";

interface Notification {
    message: string;
    type: 'error' | 'success';
}

/**
 * Custom Notification Toast Component
 */
const NotificationToast = ({ notification }: { notification: Notification | null }) => {
    if (!notification) return null;

    return (
        <div
            className={`fixed top-4 right-4 p-4 rounded-xl shadow-2xl flex items-center space-x-3 z-50 transition-all duration-300 
                ${notification.type === 'success' ? 'bg-teal-50 border-teal-300 text-teal-800' : 'bg-red-50 border-red-300 text-red-800'}
            `}
            role="alert"
        >
            {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            <p className="text-sm font-medium">{notification.message}</p>
        </div>
    );
};


/**
 * --- Start of Endpoints Tab Component ---
 * This component handles the Webhook Endpoint Configuration view.
 */
const EndpointsTab = ({ onNavigateToCatalog }) => {
    // Mock data for a realistic look
    const [endpointUrl, setEndpointUrl] = useState("https://your-server.com/webhooks/whatsapp-handler");
    const subscribedEventCount = 3; // Mocking a count > 0
    const isActive = true; // Mock status
    const [loading, setLoading] = useState(false); // To demonstrate future loading states

    // Mock function for editing the endpoint (placeholder for a future modal)
    const handleEditClick = () => {
        // In a real app, this would open a modal to change the URL
        console.log("Edit Endpoint clicked. This action typically opens a modal.");
    };

    return (
        <div className="p-8 pt-0">
            {/* Main Content */}
            <h1 className="text-3xl font-extrabold text-gray-900 flex items-center mb-2">
                <Settings className="w-7 h-7 mr-3 text-[var(--theme-color)]" /> Endpoint Configuration
            </h1>
            <p className="text-gray-500 mb-8">
                Manage your single webhook endpoint and configure the events you are subscribed to.
            </p>

            {/* Webhook Endpoint Info Card */}
            <div className="
  bg-white dark:bg-slate-800
  border border-gray-200 dark:border-slate-700
  rounded-2xl p-6 mb-10 shadow-lg
">

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b pb-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-[var(--theme-color)]" /> Current Endpoint
                    </h2>
                    <div className="flex items-center gap-3 mt-3 sm:mt-0">
                        {/* Status Badge */}
                        <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full ${isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}
                        >
                            {isActive ? 'Active' : 'Inactive'}
                        </span>

                        {/* Edit Button */}
                        <button
                            onClick={handleEditClick}
                            className="flex items-center gap-1 text-sm text-[var(--theme-color)] font-medium hover:text-indigo-700 transition"
                        >
                            <Pencil className="w-4 h-4" /> Edit URL
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-gray-700 font-semibold mb-2">Endpoint URL</label>
                    <div className="relative">
                        <input
                            type="url"
                            value={endpointUrl}
                            className="w-full border border-gray-300 rounded-xl px-5 py-3 text-gray-700 bg-gray-50 font-mono text-sm pr-12"
                            readOnly
                        />
                        <Info
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 cursor-help"
                            title="This is the URL where all your subscribed events will be delivered via HTTP POST."
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">This endpoint receives all events for your account. Click 'Edit URL' to change it.</p>
                </div>
            </div>

            {/* Subscribed Events Section */}
            <div className="
  mb-10 p-6
  bg-white dark:bg-slate-900
  border border-indigo-200 dark:border-slate-700
  rounded-2xl
">

                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                    Subscribed Events ({subscribedEventCount})
                </h2>


                {subscribedEventCount > 0 ? (
                    <div className="
               text-gray-700 dark:text-gray-300
               text-sm p-4
               bg-gray-50 dark:bg-transparent
             ">


                        You are currently subscribed to <span className="font-bold text-[var(--theme-color)]">{subscribedEventCount}</span> different event types. Notifications for these events will be sent to your configured endpoint URL.
                    </div>
                ) : (
                    <div className="
                    border border-gray-300 dark:border-slate-700
                    rounded-xl p-6 text-center
                    text-gray-500 dark:text-gray-400
                    bg-transparent
                  ">

                        No events subscribed. Click "Configure Events" below to start receiving notifications.
                    </div>
                )}
            </div>

            {/* Actions and Tip */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                {/* Configure Button - uses prop for navigation */}
                <button
                    onClick={onNavigateToCatalog}
                    disabled={loading}
                    className="flex items-center gap-2 text-[var(--theme-color)]bg-[var(--theme-color)] text-white px-6 py-3 rounded-xl font-semibold text-lg shadow-xl hover:bg-indigo-700 transition-all transform hover:scale-[1.01] shadow-indigo-400/50 w-full sm:w-auto disabled:opacity-50"
                >
                    <PlusCircle className="w-5 h-5" /> Configure Events
                </button>

                {/* Tip */}
                <div className="
  flex items-start gap-3
  text-gray-600 dark:text-gray-300
  text-sm max-w-sm p-3
  bg-white dark:bg-slate-900
  border border-yellow-200 dark:border-slate-700
  rounded-xl
">


                    <Info className="w-5 h-5 mt-0.5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />

                    <p>
                        💡 Tip: Check out the
                        <span
                            onClick={onNavigateToCatalog}
                            className="text-[var(--theme-color)] font-medium underline cursor-pointer hover:text-indigo-700 transition ml-1"
                        >
                            Event Catalog
                        </span>
                        to see all available events you can subscribe to.
                    </p>
                </div>
            </div>
        </div>
    );
}
/**
 * --- End of Endpoints Tab Component ---
 */


/**
 * --- Start of Event Catalog Tab Component (FULL IMPLEMENTATION) ---
 */
const EventCatalogTab = () => {
    const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState<Notification | null>(null);

    // Function to show transient notifications
    const showNotification = (message: string, type: 'error' | 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const allEvents = [
        {
            id: "messages",
            name: "messages",
            description: "Receive events when messages occur (incoming, outbound, status updates).",
            category: "whatsapp",
        },
        {
            id: "status_updates",
            name: "status_updates",
            description: "Receive events for template and message status changes.",
            category: "whatsapp",
        },
        {
            id: "contacts",
            name: "contacts",
            description: "Receive events when contact information changes.",
            category: "whatsapp",
        },
        // Added more events for a realistic feel
    ];

    const toggleSelectAll = () => {
        if (selectedEvents.length === allEvents.length) {
            setSelectedEvents([]);
        } else {
            setSelectedEvents(allEvents.map((e) => e.id));
        }
    };

    const toggleEvent = (id: string) => {
        setSelectedEvents((prev) =>
            prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
        );
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // Mock API Call
            const res = await fetch("/api/webhooks/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subscribedEvents: selectedEvents }),
            });

            if (res.ok) {
                showNotification("Webhook subscription updated successfully!", 'success');
            } else {
                const errorText = await res.text();
                let errorMessage = "Failed to save subscription. Status: " + res.status;

                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || errorMessage;
                } catch {
                    // Ignore if response isn't JSON
                }
                showNotification(errorMessage, 'error');
            }
        } catch (error) {
            console.error(error);
            showNotification("Network error. Could not save subscription.", 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 pt-0">
            <NotificationToast notification={notification} />

            <h1 className="text-3xl font-extrabold text-gray-900 mb-2 flex items-center">
                <BookOpen className="w-7 h-7 mr-3 text-[var(--theme-color)]" /> Event Catalog
            </h1>
            <p className="text-gray-500 mb-8">
                Subscribe to webhook events by selecting the notifications you wish to receive at your registered endpoint.
            </p>

            {/* Category Grouping */}
            <div className="mb-6">
                <h2 className="text-xl font-bold text-[var(--theme-color)] mb-4 flex items-center">
                    <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm">WhatsApp</span> Events
                </h2>
            </div>

            {/* Select All */}
            <div className="p-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl mb-6">

                <div
                    onClick={toggleSelectAll}
                    className="flex items-center gap-3 cursor-pointer select-none"
                >
                    {selectedEvents.length === allEvents.length ? (
                        <CheckSquare className="w-6 h-6 text-[var(--theme-color)] flex-shrink-0" />
                    ) : (
                        <Square className="w-6 h-6 text-indigo-400 flex-shrink-0" />
                    )}
                    <span className="text-gray-800 font-bold text-lg">Select All Events</span>
                    <span className="text-indigo-500 text-sm ml-auto">{selectedEvents.length} of {allEvents.length} Selected</span>
                </div>
            </div>


            {/* Event List */}
            <div className="space-y-3">
                {allEvents.map((event) => {
                    const isSelected = selectedEvents.includes(event.id);
                    return (
                        <div
                            key={event.id}
                            onClick={() => toggleEvent(event.id)}
                            className={`border rounded-xl p-4 flex items-start gap-4 cursor-pointer shadow-sm
                                ${isSelected
                                    ? "border-indigo-500 bg-white dark:bg-slate-900"
                                    : "border-gray-200 bg-white dark:bg-slate-900"
                                }`}

                        >
                            {isSelected ? (
                                <CheckSquare className="w-5 h-5 text-[var(--theme-color)] mt-1 flex-shrink-0" />
                            ) : (
                                <Square className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                            )}
                            <div>
                                <h3 className="font-semibold text-gray-900 capitalize">{event.name.replace('_', ' ')}</h3>
                                <p className="text-gray-500 text-sm">{event.description}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Save Button */}
            <div className="mt-10 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 text-[var(--theme-color)]bg-[var(--theme-color)] text-white px-8 py-3 rounded-xl font-semibold text-lg shadow-xl hover:bg-indigo-700 transition-all transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed shadow-indigo-400/50"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" /> Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" /> Save Subscription
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
/**
 * --- Start of Logs Tab Component ---
 */
const LogsTab = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<any>(null);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/webhook/logs");
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
            }
        } catch (error) {
            console.error("Failed to fetch logs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    return (
        <div className="p-8 pt-0">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-2 flex items-center">
                        <History className="w-7 h-7 mr-3 text-[var(--theme-color)]" /> Inbound Webhook Logs
                    </h1>
                    <p className="text-gray-500">
                        View raw payloads received from WhatsApp in real-time. Useful for debugging.
                    </p>
                </div>
                <button
                    onClick={fetchLogs}
                    className="flex items-center gap-2 px-4 py-2 border rounded-xl hover:bg-gray-50 transition"
                >
                    <History className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </button>
            </div>

            {loading && logs.length === 0 ? (
                <div className="flex justify-center p-20">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
            ) : logs.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed rounded-2xl">
                    <Webhook className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No webhook logs found yet.</p>
                    <p className="text-sm text-gray-400">Send a test message from Meta dashboard to see logs here.</p>
                </div>
            ) : (
                <div className="flex gap-6 h-[600px]">
                    {/* Log List */}
                    <div className="w-1/3 overflow-y-auto border rounded-2xl bg-white shadow-sm">
                        {logs.map((log) => (
                            <div
                                key={log.id}
                                onClick={() => setSelectedLog(log)}
                                className={`p-4 border-b cursor-pointer hover:bg-indigo-50 transition-colors last:border-0 ${selectedLog?.id === log.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${log.status === 'PROCESSED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {log.status}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                        {format(new Date(log.createdAt), "HH:mm:ss")}
                                    </span>
                                </div>
                                <div className="text-xs font-mono text-gray-600 truncate">
                                    ID: {log.id}
                                </div>
                                <div className="text-[10px] text-gray-400 mt-1">
                                    {format(new Date(log.createdAt), "MMM d, yyyy")}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Log Detail */}
                    <div className="flex-1 border rounded-2xl bg-gray-50 overflow-hidden flex flex-col shadow-inner">
                        {selectedLog ? (
                            <>
                                <div className="bg-white p-4 border-b flex justify-between items-center">
                                    <h3 className="font-bold text-gray-800">Payload Detail</h3>
                                    <span className="text-xs text-gray-500">Received at {format(new Date(selectedLog.createdAt), "yyyy-MM-dd HH:mm:ss")}</span>
                                </div>
                                <div className="p-4 flex-1 overflow-auto">
                                    <pre className="text-xs font-mono bg-gray-900 text-green-400 p-4 rounded-xl shadow-2xl">
                                        {JSON.stringify(selectedLog.payload, null, 2)}
                                    </pre>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                                <Eye className="w-12 h-12 mb-2 opacity-20" />
                                <p>Select a log to view details</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
/**
 * --- End of Logs Tab Component ---
 */


/**
 * --- Main Webhooks Dashboard Component ---
 */
export default function WebhooksPage() {
    const [activeTab, setActiveTab] = useState('endpoints');

    const tabs = [
        { id: "endpoints", name: "Endpoints", icon: Webhook, component: EndpointsTab },
        { id: "catalog", name: "Event Catalog", icon: BookOpen, component: EventCatalogTab },
        { id: "logs", name: "Inbound Logs", icon: Clock, component: LogsTab },
    ];

    // Function to handle navigation to the catalog tab (used by EndpointsTab component)
    const handleNavigateToCatalog = () => {
        setActiveTab('catalog');
    }

    // Determine which component to render
    const ActiveComponent = tabs.find(t => t.id === activeTab)?.component;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 md:p-10">

            <div className="
  max-w-6xl mx-auto
 bg-white dark:bg-slate-900
  rounded-3xl shadow-2xl
  border border-gray-100 dark:border-slate-800
">


                {/* Global Header */}
                <div className="px-6 py-6 border-b border-gray-200 sm:px-8">
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">Webhooks Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">

                        Configure and manage your webhook endpoints and event subscriptions for real-time notifications.
                    </p>
                </div>

                {/* Tabs Navigation */}
                <div className="flex border-b border-gray-200 px-6 sm:px-8">
                    {tabs.map(({ id, name, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold -mb-px border-b-2 transition-all duration-200 
                                ${activeTab === id
                                    ? "border-indigo-600 text-[var(--theme-color)] bg-indigo-50 dark:bg-slate-800"

                                    : "border-transparent text-gray-600 hover:text-[var(--theme-color)] hover:border-gray-300"
                                }`}
                        >
                            <Icon className="w-4 h-4" /> {name}
                        </button>
                    ))}
                </div>

                {/* Tab Content Area */}
                <div className="p-0">
                    {ActiveComponent && (
                        // Render the active component, passing the navigation handler if needed
                        <ActiveComponent
                            onNavigateToCatalog={activeTab === 'endpoints' ? handleNavigateToCatalog : undefined}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
