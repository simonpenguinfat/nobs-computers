"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BUILD_STATUSES, isArchivedStatus } from "@/lib/types";
import type { BuildRequest, Profile } from "@/lib/types";
import ChatBox from "./ChatBox";
import BuildQuoteEditor from "./BuildQuoteEditor";

interface ClientWithProfile extends BuildRequest {
  profiles: Profile;
}

interface BuilderDashboardProps {
  clients: ClientWithProfile[];
  builderId: string;
  builderName: string;
}

type DetailTab = "build" | "chat";

export default function BuilderDashboard({
  clients: initialClients,
  builderId,
  builderName,
}: BuilderDashboardProps) {
  const [clients, setClients] = useState(initialClients);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>("build");
  const [updating, setUpdating] = useState(false);
  const [actionError, setActionError] = useState("");
  const supabase = useMemo(() => createClient(), []);

  const selected = clients.find((c) => c.id === selectedId) ?? null;

  function removeClient(requestId: string) {
    setClients((prev) => prev.filter((c) => c.id !== requestId));
    setSelectedId(null);
    setActiveTab("build");
  }

  function openClient(clientId: string) {
    const client = clients.find((c) => c.id === clientId);
    setSelectedId(clientId);
    setActiveTab(client?.status === "pending" ? "chat" : "build");
  }

  function closeClient() {
    setSelectedId(null);
    setActiveTab("build");
  }

  function formatStatusError(message: string): string {
    const lower = message.toLowerCase();

    if (lower.includes("check constraint") || lower.includes("rejected")) {
      return "Decline failed — run fix-decline-order.sql in Supabase SQL Editor, then try again.";
    }

    if (lower.includes("permission denied") || lower.includes("row-level security")) {
      return "Permission denied. Make sure your account has the builder role in Supabase.";
    }

    return message;
  }

  async function updateStatus(
    requestId: string,
    status: BuildRequest["status"],
    options?: { onlyFromStatus?: BuildRequest["status"] }
  ): Promise<boolean> {
    setUpdating(true);
    setActionError("");

    let query = supabase
      .from("build_requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", requestId);

    if (options?.onlyFromStatus) {
      query = query.eq("status", options.onlyFromStatus);
    }

    const { data, error } = await query.select("*").maybeSingle();

    if (error) {
      setActionError(formatStatusError(error.message));
      setUpdating(false);
      return false;
    }

    if (!data) {
      setActionError(
        "Could not update this order. It may have already changed — refresh the page."
      );
      setUpdating(false);
      return false;
    }

    if (isArchivedStatus(status)) {
      removeClient(requestId);
    } else {
      setClients((prev) =>
        prev.map((c) => {
          if (c.id !== requestId) return c;
          return { ...c, ...(data as BuildRequest) };
        })
      );
    }

    setUpdating(false);
    return true;
  }

  async function acceptOrder(requestId: string) {
    const ok = await updateStatus(requestId, "in_progress", {
      onlyFromStatus: "pending",
    });
    if (ok) {
      setActiveTab("build");
    }
  }

  async function declineOrder(requestId: string) {
    if (!confirm("Decline this order? It will be removed from your dashboard.")) {
      return;
    }
    await updateStatus(requestId, "rejected", { onlyFromStatus: "pending" });
  }

  async function cancelOrder(requestId: string) {
    if (!confirm("Cancel this order? It will be removed from your dashboard.")) {
      return;
    }
    await updateStatus(requestId, "cancelled");
  }

  async function updateEstimate(requestId: string, cost: number) {
    const { data } = await supabase
      .from("build_requests")
      .update({ estimated_cost: cost, updated_at: new Date().toISOString() })
      .eq("id", requestId)
      .select("*, profiles!buyer_id(*)")
      .single();

    if (data) {
      setClients((prev) =>
        prev.map((c) => (c.id === requestId ? (data as ClientWithProfile) : c))
      );
    }
  }

  const pendingCount = clients.filter((c) => c.status === "pending").length;
  const activeCount = clients.filter((c) => c.status === "in_progress").length;
  const issueCount = clients.filter((c) => c.status === "not_received").length;

  useEffect(() => {
    const channel = supabase
      .channel("admin-build-requests")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "build_requests",
        },
        (payload) => {
          const updated = payload.new as BuildRequest;

          if (isArchivedStatus(updated.status)) {
            setClients((prev) => prev.filter((c) => c.id !== updated.id));
            setSelectedId((current) =>
              current === updated.id ? null : current
            );
            return;
          }

          setClients((prev) => {
            const exists = prev.some((c) => c.id === updated.id);
            if (!exists) return prev;
            return prev.map((c) =>
              c.id === updated.id ? { ...c, ...updated } : c
            );
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-surface-card border border-border rounded-xl p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-neutral-900">{clients.length}</p>
          <p className="text-xs text-neutral-500 mt-1">Active Orders</p>
        </div>
        <div className="bg-surface-card border border-border rounded-xl p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-amber-600">{pendingCount}</p>
          <p className="text-xs text-neutral-500 mt-1">Needs Review</p>
        </div>
        <div className="bg-surface-card border border-border rounded-xl p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-green-600">{activeCount}</p>
          <p className="text-xs text-neutral-500 mt-1">In Progress</p>
        </div>
        <div className="bg-surface-card border border-border rounded-xl p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-red-600">{issueCount}</p>
          <p className="text-xs text-neutral-500 mt-1">Not Received</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-1 ${selected ? "hidden lg:block" : ""}`}>
          <h2 className="font-semibold mb-3 text-neutral-900">Orders</h2>
          {clients.length === 0 ? (
            <div className="bg-surface-card border border-border rounded-xl p-6 text-center">
              <p className="text-neutral-500 text-sm">No active orders.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {clients.map((client) => {
                const statusInfo = BUILD_STATUSES[client.status];
                const isSelected = client.id === selectedId;
                return (
                  <button
                    key={client.id}
                    onClick={() => openClient(client.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      isSelected
                        ? "border-neutral-900 bg-neutral-50"
                        : client.status === "pending"
                          ? "border-amber-300 bg-amber-50 hover:border-amber-400"
                          : client.status === "not_received"
                            ? "border-red-300 bg-red-50 hover:border-red-400"
                            : "border-border bg-surface-card hover:border-neutral-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <p className="font-medium text-sm text-neutral-900 truncate">
                        {client.profiles?.full_name || client.profiles?.email}
                      </p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.color}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500">
                      {client.use_case} · ${client.budget?.toLocaleString()}
                    </p>
                    <p className="text-xs text-neutral-700 mt-2 font-medium">
                      {client.status === "pending" ? "Review & chat →" : "View build →"}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className={`lg:col-span-2 ${!selected ? "hidden lg:block" : ""}`}>
          {selected ? (
            <div className="space-y-4">
              <button
                onClick={closeClient}
                className="lg:hidden text-sm text-neutral-700 hover:text-neutral-900 font-medium flex items-center gap-1 mb-2"
              >
                ← Back to orders
              </button>

              <div className="bg-surface-card border border-border rounded-xl overflow-hidden">
                <div className="px-4 sm:px-5 pt-5 pb-0 border-b border-border bg-white">
                  <h2 className="font-semibold mb-4 text-neutral-900">
                    {selected.profiles?.full_name || "Client"}&apos;s Build
                  </h2>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setActiveTab("build")}
                      className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                        activeTab === "build"
                          ? "bg-neutral-50 text-neutral-900 border-b-2 border-neutral-900"
                          : "text-neutral-500 hover:text-neutral-700"
                      }`}
                    >
                      Build Details
                    </button>
                    <button
                      onClick={() => setActiveTab("chat")}
                      className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                        activeTab === "chat"
                          ? "bg-neutral-50 text-neutral-900 border-b-2 border-neutral-900"
                          : "text-neutral-500 hover:text-neutral-700"
                      }`}
                    >
                      Chat
                      {selected.status === "pending" && (
                        <span className="ml-1.5 text-amber-600">●</span>
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-4 sm:p-5 bg-white">
                  {activeTab === "build" ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-neutral-500">Use Case</p>
                          <p className="text-sm text-neutral-900">{selected.use_case}</p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-500">Budget</p>
                          <p className="text-sm text-neutral-900">
                            ${selected.budget?.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-500">Existing Parts</p>
                          <p className="text-sm text-neutral-900">
                            {selected.existing_parts || "None"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-500">Preferences</p>
                          <p className="text-sm text-neutral-900">
                            {selected.preferences || "None"}
                          </p>
                        </div>
                      </div>

                      {selected.status === "pending" && (
                        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                          <p className="text-sm text-amber-900">
                            <strong>Review this order.</strong> Chat with the customer first,
                            then accept or decline.
                          </p>
                          {actionError && (
                            <p className="text-sm text-red-700">{actionError}</p>
                          )}
                          <div className="flex flex-col sm:flex-row gap-3">
                            <button
                              type="button"
                              onClick={() => acceptOrder(selected.id)}
                              disabled={updating}
                              className="flex-1 py-2.5 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors"
                            >
                              Accept Order
                            </button>
                            <button
                              type="button"
                              onClick={() => declineOrder(selected.id)}
                              disabled={updating}
                              className="flex-1 py-2.5 border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50 font-medium rounded-lg text-sm transition-colors"
                            >
                              Decline Order
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveTab("chat")}
                            className="w-full py-2 text-sm text-amber-800 hover:text-amber-900 font-medium"
                          >
                            Open chat with customer →
                          </button>
                        </div>
                      )}

                      {selected.status === "not_received" && (
                        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                          <p className="text-sm font-medium text-red-800">
                            Customer reported they did not receive the build.
                          </p>
                          <p className="text-sm text-red-700 mt-1">
                            Review and update the status when resolved.
                          </p>
                        </div>
                      )}

                      {selected.status === "completed" && (
                        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
                          <p className="text-sm text-green-800">
                            Waiting for customer to confirm they received their build.
                          </p>
                        </div>
                      )}

                      {selected.status !== "pending" && (
                        <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-end">
                          <div className="flex-1 sm:flex-none">
                            <label className="text-xs text-neutral-500 block mb-1">
                              Status
                            </label>
                            <select
                              value={selected.status}
                              disabled={updating}
                              onChange={(e) =>
                                updateStatus(
                                  selected.id,
                                  e.target.value as BuildRequest["status"]
                                )
                              }
                              className="w-full sm:w-auto bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neutral-400"
                            >
                              {Object.entries(BUILD_STATUSES)
                                .filter(
                                  ([key]) =>
                                    !["confirmed", "rejected", "pending"].includes(key)
                                )
                                .map(([key, val]) => (
                                  <option key={key} value={key}>
                                    {val.label}
                                  </option>
                                ))}
                            </select>
                          </div>
                          <div className="flex-1 sm:flex-none">
                            <label className="text-xs text-neutral-500 block mb-1">
                              Estimated Cost (CAD)
                            </label>
                            <input
                              key={String(selected.estimated_cost ?? "empty")}
                              type="number"
                              defaultValue={selected.estimated_cost ?? ""}
                              onBlur={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val)) updateEstimate(selected.id, val);
                              }}
                              placeholder="Enter quote"
                              className="w-full sm:w-36 bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neutral-400"
                            />
                          </div>
                        </div>
                      )}

                      <BuildQuoteEditor
                        key={selected.id}
                        buildRequestId={selected.id}
                        onUseAsEstimate={(total) => updateEstimate(selected.id, total)}
                      />

                      {selected.status !== "pending" && (
                        <button
                          type="button"
                          onClick={() => cancelOrder(selected.id)}
                          disabled={updating}
                          className="mt-4 w-full py-2.5 border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
                        >
                          Cancel Order
                        </button>
                      )}

                      <button
                        onClick={() => setActiveTab("chat")}
                        className="mt-4 w-full py-2.5 border border-border text-neutral-700 hover:bg-neutral-50 rounded-lg text-sm font-medium transition-colors"
                      >
                        Open chat with {selected.profiles?.full_name || "client"}
                      </button>
                    </>
                  ) : (
                    <ChatBox
                      buildRequestId={selected.id}
                      userId={builderId}
                      userName={builderName}
                    />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface-card border border-border rounded-xl p-8 sm:p-12 text-center">
              <p className="text-neutral-500 text-sm">
                Select an order from the list to review and chat.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
