"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Copy,
  Plus,
  Eye,
  MoreHorizontal,
  Trash2,
  X,
  Check,
  Loader2,
  Settings,
  ExternalLink,
  Clock,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-hot-toast";
import Link from "next/link";

type WhatsAppAccount = {
  id: number;
  phoneNumber: string;
  phoneNumberId: string;
  wabaId: string;
  accessToken: string;
  verifyToken?: string;
  appId?: string;
  appSecret?: string;
  apiVersion?: string;
  isActive: boolean;
  status?: string; // PENDING_EMBEDDED_SIGNUP | ACTIVE | ERROR
};

export default function ManageWhatsAppPage() {
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] =
    useState<Partial<WhatsAppAccount> | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(false);
  const [pendingAccountId, setPendingAccountId] = useState<string | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/config");
      const data = await res.json();
      if (Array.isArray(data)) {
        setAccounts(data);

        // Check if any accounts are still pending
        const hasPending = data.some(
          (acc: WhatsAppAccount) => acc.status === "PENDING_EMBEDDED_SIGNUP"
        );

        // If pending account resolved, show success toast
        if (pendingAccountId && !hasPending) {
          const resolvedAccount = data.find(
            (acc: WhatsAppAccount) => acc.id === Number(pendingAccountId)
          );
          if (resolvedAccount && resolvedAccount.status === "ACTIVE") {
            toast.success("WhatsApp account setup completed!");
            setPendingStatus(false);
            setPendingAccountId(null);
            window.history.replaceState({}, "", "/integrations/whatsapp");
          }
        }

        return hasPending;
      }
      return false;
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [pendingAccountId]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Handle URL params for pending/success status
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success") === "true";
    const pending = params.get("status") === "pending";
    const accountId = params.get("account_id");

    if (success) {
      toast.success(
        "WhatsApp account connected successfully! Credits have been allocated.",
      );
      // Claim account so it shows under current user (in case it was created with DEFAULT_USER_ID)
      if (accountId) {
        fetch("/api/whatsapp/accounts/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ accountId }),
        })
          .then(() => fetchAccounts())
          .catch(() => fetchAccounts());
      } else {
        fetchAccounts();
      }
      window.history.replaceState({}, "", "/integrations/whatsapp");
    }

    if (pending) {
      setPendingStatus(true);
      setPendingAccountId(accountId);
      // Claim the pending account for the current user
      if (accountId) {
        fetch("/api/whatsapp/accounts/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ accountId }),
        }).catch(console.error);
      }
    }
  }, [fetchAccounts]);

  // Auto-refresh when pending accounts exist
  useEffect(() => {
    if (pendingStatus) {
      // Set up auto-refresh every 10 seconds
      refreshIntervalRef.current = setInterval(async () => {
        const stillPending = await fetchAccounts();
        if (!stillPending) {
          // All accounts resolved, stop refreshing
          if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
            refreshIntervalRef.current = null;
          }
        }
      }, 10000);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [pendingStatus, fetchAccounts]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/whatsapp/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingAccount),
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchAccounts();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save");
      }
    } catch (error) {
      alert("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (account: WhatsAppAccount | null = null) => {
    setEditingAccount(
      account || {
        apiVersion: "v22.0",
        isActive: true,
      },
    );
    setIsModalOpen(true);
  };

  const getStatusBadge = (account: WhatsAppAccount) => {
    if (account.status === "PENDING_EMBEDDED_SIGNUP") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600">
          <Clock size={12} className="animate-pulse" />
          Setting up...
        </span>
      );
    }
    if (account.status === "ERROR") {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600">
          Error
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${account.isActive
          ? "bg-emerald-50 text-emerald-600"
          : "bg-gray-100 text-gray-400"
          }`}
      >
        {account.isActive ? "Active" : "Inactive"}
      </span>
    );
  };

  const handleDelete = async (accountId: number) => {
    if (!confirm("Are you sure you want to delete this WhatsApp account?")) {
      return;
    }

    const toastId = toast.loading("Deleting account...");
    try {
      const res = await fetch(`/api/whatsapp/config?id=${accountId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Account deleted successfully", { id: toastId });
        fetchAccounts();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete account", { id: toastId });
      }
    } catch (error) {
      toast.error("An error occurred while deleting", { id: toastId });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen bg-gray-50/50">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Manage WhatsApp
          </h1>
          <p className="text-gray-500 mt-2 text-lg">
            Configure your Meta Business credentials and API settings
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/signup/whatsapp"
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all duration-200"
          >
            <ExternalLink size={20} />
            Embedded Signup
          </Link>
          <Link
            href="/integrations/whatsapp/embedded-signup"
            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 border border-gray-200"
          >
            <Settings size={18} />
            Embedded Signup Setup
          </Link>
          <button
            onClick={() => openEdit()}
            className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-0.5 transition-all duration-200"
          >
            <Plus size={20} />
            Add Account
          </button>
        </div>
      </div>

      {/* Pending Status Banner */}
      {pendingStatus && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-amber-600 animate-spin" />
            </div>
            <div>
              <h3 className="font-bold text-amber-900">
                WhatsApp setup is in progress
              </h3>
              <p className="text-amber-700 text-sm">
                This may take up to 1 minute. The page will automatically update once complete.
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchAccounts()}
            className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg font-medium text-sm transition-colors"
          >
            Check Now
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
          <p className="text-gray-400 font-medium">Loading your accounts...</p>
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-80 bg-white rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
            <Plus className="w-10 h-10 text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No WhatsApp Accounts
          </h3>
          <p className="text-gray-500 max-w-md mx-auto mb-8">
            You haven't added any WhatsApp Business accounts yet. Connect your
            first account to start sending messages.
          </p>
          <button
            onClick={() => openEdit()}
            className="text-emerald-600 font-bold hover:text-emerald-700 transition-colors"
          >
            Connect an account now →
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Phone Number
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Credentials
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {accounts.map((account) => (
                <tr
                  key={account.id}
                  className="hover:bg-gray-50/50 transition-colors group"
                >
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${account.status === "PENDING_EMBEDDED_SIGNUP"
                        ? "bg-amber-100 text-amber-600"
                        : "bg-emerald-100 text-emerald-600"
                        }`}>
                        WA
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">
                          {account.phoneNumber || (
                            <span className="text-gray-400 italic">Pending...</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">
                          ID: {account.phoneNumberId || (
                            <span className="italic">Resolving...</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                      <code className="text-[10px] bg-slate-50 px-2 py-0.5 rounded text-slate-500 border border-slate-100 w-fit font-mono">
                        WABA: {account.wabaId || (
                          <span className="italic text-amber-500">Pending...</span>
                        )}
                      </code>
                      <code className="text-[10px] bg-emerald-50 px-2 py-0.5 rounded text-emerald-600 border border-emerald-100 w-fit font-mono">
                        Key: {account.accessToken.substring(0, 10)}...
                      </code>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    {getStatusBadge(account)}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(account)}
                        className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        title="Edit Configuration"
                      >
                        <Settings size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(account.id)}
                        className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={async () => {
                          const toastId = toast.loading(
                            "Testing connection...",
                          );
                          try {
                            const res = await fetch("/api/whatsapp/test", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ accountId: account.id }),
                            });
                            const data = await res.json();
                            if (res.ok) {
                              toast.success("Connection Successful!", {
                                id: toastId,
                              });
                              // Refresh to get updated account status
                              fetchAccounts();
                            } else if (data.pending) {
                              toast.loading(
                                "Setup in progress... Please wait and try again.",
                                { id: toastId, duration: 3000 }
                              );
                            } else {
                              toast.error("Connection Failed: " + data.error, {
                                id: toastId,
                              });
                            }
                          } catch (e) {
                            toast.error("Test Error", { id: toastId });
                          }
                        }}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition"
                      >
                        Test Connection
                      </button>
                      <button
                        onClick={async () => {
                          const toastId = toast.loading(
                            "Subscribing to webhooks...",
                          );
                          try {
                            const res = await fetch("/api/whatsapp/subscribe-webhooks", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ accountId: account.id }),
                            });
                            const data = await res.json();
                            if (res.ok && data.success) {
                              toast.success("Webhooks enabled! You'll now receive messages.", {
                                id: toastId,
                              });
                            } else {
                              toast.error("Failed: " + (data.error || "Unknown error"), {
                                id: toastId,
                              });
                            }
                          } catch (e) {
                            toast.error("Error enabling webhooks", { id: toastId });
                          }
                        }}
                        className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition"
                      >
                        Enable Webhooks
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modern Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingAccount?.id
                    ? "Edit WhatsApp Config"
                    : "Connect New Account"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Enter your Meta Graph API credentials
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white rounded-full text-gray-400 hover:text-gray-900 transition-colors shadow-sm"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8">
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">
                    Phone Number
                  </label>
                  <input
                    required
                    placeholder="+91 99999 99999"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all text-gray-900"
                    value={editingAccount?.phoneNumber || ""}
                    onChange={(e) =>
                      setEditingAccount({
                        ...editingAccount!,
                        phoneNumber: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">
                    Phone Number ID
                  </label>
                  <input
                    required
                    placeholder="From Meta Dashboard"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all text-gray-900"
                    value={editingAccount?.phoneNumberId || ""}
                    onChange={(e) =>
                      setEditingAccount({
                        ...editingAccount!,
                        phoneNumberId: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">
                    WABA ID
                  </label>
                  <input
                    required
                    placeholder="WhatsApp Business Account ID"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all text-gray-900"
                    value={editingAccount?.wabaId || ""}
                    onChange={(e) =>
                      setEditingAccount({
                        ...editingAccount!,
                        wabaId: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">
                    Verify Token (Custom)
                  </label>
                  <input
                    placeholder="Any secret string"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all text-gray-900"
                    value={editingAccount?.verifyToken || ""}
                    onChange={(e) =>
                      setEditingAccount({
                        ...editingAccount!,
                        verifyToken: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">
                    System User Access Token
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="EAAG..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all text-gray-900 font-mono text-sm"
                    value={editingAccount?.accessToken || ""}
                    onChange={(e) =>
                      setEditingAccount({
                        ...editingAccount!,
                        accessToken: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">
                    App ID (Optional)
                  </label>
                  <input
                    placeholder="Meta App ID"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all text-gray-900"
                    value={editingAccount?.appId || ""}
                    onChange={(e) =>
                      setEditingAccount({
                        ...editingAccount!,
                        appId: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">
                    App Secret (Optional)
                  </label>
                  <input
                    type="password"
                    placeholder="Meta App Secret"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all text-gray-900"
                    value={editingAccount?.appSecret || ""}
                    onChange={(e) =>
                      setEditingAccount({
                        ...editingAccount!,
                        appSecret: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={saving}
                  type="submit"
                  className="px-8 py-3 rounded-xl font-bold bg-gray-900 text-white hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-xl shadow-gray-200"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Check size={20} />
                  )}
                  {editingAccount?.id ? "Update Settings" : "Connect Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
