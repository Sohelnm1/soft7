"use client";

import { useState } from "react";
import { Search, Plug, CheckCircle, Settings, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

type Integration = {
  id: string;
  name: string;
  description: string;
  connected: boolean;
  logo?: string;
  category?: "featured" | "flow";
  buttonType?: "connect" | "configure" | "setup";
};

const initialIntegrations: Integration[] = [
  {
    id: "1",
    name: "WhatsApp Business",
    description:
      "Connect with customers on their favorite messaging app. Send updates, support messages, and more directly through WhatsApp.",
    connected: true,
    logo: "/whatsapp-logo.jpg",
    category: "featured",
  },
  {
    id: "2",
    name: "Indiamart",
    description: "Get leads from IndiaMart and sync them to our CRM.",
    connected: false,
    logo: "/indiamart-logo.png",
    category: "featured",
  },
  {
    id: "3",
    name: "Facebook Messenger",
    description:
      "Chat with customers on Facebook Messenger directly from your dashboard for seamless support.",
    connected: false,
    logo: "/facebook-logo.jpg",
    category: "flow",
  },
  {
    id: "4",
    name: "Instagram",
    description:
      "Sync data and trigger automations based on successful interactions.",
    connected: false,
    logo: "/instagram-logo.jpg",
    category: "flow",
  },
  {
    id: "5",
    name: "Google Sheets",
    description:
      "Automatically export data and reports to a Google Sheet for analysis and sharing.",
    connected: true,
    logo: "/google-sheet-logo.jpg",
    category: "flow",
  },

  {
    id: "7",
    name: "Facebook Lead Ads",
    description: "Automate lead generation and manage customer inquiries directly from Facebook. Capture leads, respond to...",
    connected: false,
    logo: "/facebook-logo.jpg",
    category: "featured",
  },

];

// --- Card Component ---
const IntegrationCard = ({ integration }: { integration: Integration }) => {
  const router = useRouter();
  const isConnected = integration.connected;

  const cardBorder = isConnected
    ? "border-green-300 dark:border-green-700 shadow-lg ring-1 ring-green-100 dark:ring-green-800/40"
    : "border-gray-200 dark:border-gray-700 shadow-md";

  const hoverEffect = isConnected
    ? "hover:border-green-500 dark:hover:border-green-400 hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
    : "hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xl hover:scale-[1.02] transition-all duration-300";

  const buttonText = integration.buttonType === "setup"
    ? "Setup"
    : integration.buttonType === "configure"
      ? "Configure"
      : "Connect";

  return (
    <div
      key={integration.id}
      className={`relative flex flex-col h-full rounded-xl p-6 border bg-white dark:bg-gray-800 ${cardBorder} ${hoverEffect}`}
    >
      {/* Status Badge */}
      <div
        className={`absolute top-0 right-0 m-3 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${isConnected
          ? "bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-300 ring-1 ring-green-200 dark:ring-green-800/60"
          : "bg-gray-50 dark:bg-gray-900/60 text-gray-600 dark:text-gray-400 ring-1 ring-gray-200 dark:ring-gray-700"
          }`}
      >
        {isConnected ? <CheckCircle className="w-3 h-3" /> : <Plug className="w-3 h-3" />}
        {isConnected ? "Active" : "New"}
      </div>

      {/* Logo */}
      {integration.logo ? (
        <img
          src={integration.logo}
          alt={integration.name}
          className="w-14 h-14 rounded-xl object-contain mb-4 border border-gray-100 dark:border-gray-700 p-1 shadow-sm"
        />
      ) : (
        <div className="w-14 h-14 rounded-xl mb-4 bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
          <Plug className="w-6 h-6" />
        </div>
      )}

      {/* Title & Description */}
      <h2 className="text-xl font-bold mb-1 text-gray-900 dark:text-gray-100 leading-snug">
        {integration.name}
      </h2>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 flex-grow">
        {integration.description}
      </p>

      {/* Action Buttons */}
      <div className="mt-auto flex gap-3">
        <button
          onClick={() => {
            if (integration.id === "1") {
              // WhatsApp - open embedded signup
              router.push("/signup/whatsapp");
            }
            // Other integrations can be handled here
          }}
          className="flex-1 py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-all duration-200"
        >
          <ArrowRight className="w-4 h-4" />
          {buttonText}
        </button>
        <button
          onClick={() => {
            if (integration.id === "1") {
              router.push("/integrations/whatsapp");
            } else {
              router.push(`/integrations/${integration.id}/manage`);
            }
          }}
          className="flex-1 py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800 transition-all duration-200"
        >
          <Settings className="w-4 h-4" />
          Manage
        </button>
      </div>
    </div>
  );
};

// --- Main Page ---
export default function IntegrationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [integrations] = useState(initialIntegrations);
  const [showConnected, setShowConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "featured" | "flows">("all");

  const filteredIntegrations = integrations.filter((i) => {
    const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesConnected = !showConnected || i.connected;
    const matchesTab = activeTab === "all" ||
      (activeTab === "featured" && i.category === "featured") ||
      (activeTab === "flows" && i.category === "flow");

    return matchesSearch && matchesConnected && matchesTab;
  });

  const totalApps = integrations.length;
  const featuredCount = integrations.filter(i => i.category === "featured").length;
  const flowsCount = integrations.filter(i => i.category === "flow").length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-10 transition-colors duration-300">
      {/* Header */}
      <header className="mb-6 p-6 bg-white dark:bg-gray-800 rounded-xl border-t-4 border-blue-600 dark:border-blue-500">
        <h1 className="text-4xl font-extrabold mb-3 text-gray-900 dark:text-white">
          App Marketplace 🧩
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg whitespace-nowrap">
          Connect your favorite tools to automate workflows, sync data, and unlock new features.
        </p>
      </header>




      {/* Search & Filters */}
      <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="relative w-full md:max-w-lg">

          {/* Search icon ALWAYS visible (Google-style) */}
          <Search
            className="absolute left-3 inset-y-0 my-auto w-5 h-5 text-gray-400 pointer-events-none"
          />

          <input
            type="text"
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            /* FORCE spacing so placeholder + typing NEVER touch icon */
            style={{ paddingLeft: "3.2rem" }}
            className={`
      w-full
      pr-10
      py-3
      border border-gray-300 dark:border-gray-700
      rounded-lg shadow-sm
      bg-white dark:bg-gray-800
      text-gray-700 dark:text-gray-200
      focus:ring-4
      focus:ring-blue-100 dark:focus:ring-blue-900
      focus:border-blue-500
      transition-all
      placeholder:text-gray-400
      leading-normal
    `}
          />
        </div>





        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="connected-filter"
            checked={showConnected}
            onChange={(e) => setShowConnected(e.target.checked)}
            className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
          <label
            htmlFor="connected-filter"
            className="text-sm font-medium text-gray-700 dark:text-gray-300 select-none"
          >
            Show only Connected Apps ({integrations.filter((i) => i.connected).length})
          </label>
        </div>
      </div>
      <style jsx>{`
  .placeholder-fix::placeholder {
    transform: translateY(3px);
    display: block;
  }
`}</style>

      {/* Tabs */}
      <div className="flex gap-2 mb-10">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "all"
            ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-gray-700"
            : "bg-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab("featured")}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "featured"
            ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-gray-700"
            : "bg-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
        >
          Featured
        </button>
        <button
          onClick={() => setActiveTab("flows")}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "flows"
            ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-gray-700"
            : "bg-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
        >
          Flows
        </button>
      </div>

      {/* Integrations Grid */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredIntegrations.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-gray-800 p-10 rounded-xl shadow-md text-center">
            <p className="text-xl text-gray-500 dark:text-gray-400">
              No integrations match your search or filter criteria. 😔
            </p>
            {(searchQuery || showConnected) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setShowConnected(false);
                }}
                className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/40 transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          filteredIntegrations.map((integration) => (
            <IntegrationCard key={integration.id} integration={integration} />
          ))
        )}
      </div>
    </div>
  );
}