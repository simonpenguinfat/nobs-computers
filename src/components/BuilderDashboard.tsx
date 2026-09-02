"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BUILD_STATUSES } from "@/lib/types";
import type { BuildRequest, Profile } from "@/lib/types";
import ChatBox from "./ChatBox";

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
  const supabase = useMemo(() => createClient(), []);

  const selected = clients.find((c) => c.id === selectedId) ?? null;

  function openClient(clientId: string) {
    setSelectedId(clientId);
    setActiveTab("build");
  }

  function closeClient() {
    setSelectedId(null);
    setActiveTab("build");
  }

  async function updateStatus(
    requestId: string,
    status: BuildRequest["status"]
  ) {
    setUpdating(true);
    const { data } = await supabase
      .from("build_requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", requestId)
      .select("*, profiles!buyer_id(*)")
      .single();

    if (data) {
      setClients((prev) =>
        prev.map((c) => (c.id === requestId ? (data as ClientWithProfile) : c))
      );
    }
    setUpdating(false);
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

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-surface-card border border-border rounded-xl p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-neutral-900">{clients.length}</p>
          <p className="text-xs text-neutral-500 mt-1">Total Clients</p>
        </div>
        <div className="bg-surface-card border border-border rounded-xl p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-amber-600">{pendingCount}</p>
          <p className="text-xs text-neutral-500 mt-1">Pending</p>
        </div>
        <div className="bg-surface-card border border-border rounded-xl p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-green-600">{activeCount}</p>
          <p className="text-xs text-neutral-500 mt-1">In Progress</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client list — always visible on desktop, hidden on mobile when detail open */}
        <div className={`lg:col-span-1 ${selected ? "hidden lg:block" : ""}`}>
          <h2 className="font-semibold mb-3 text-neutral-900">Clients</h2>
          {clients.length === 0 ? (
            <div className="bg-surface-card border border-border rounded-xl p-6 text-center">
              <p className="text-neutral-500 text-sm">No clients yet.</p>
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
                    <p className="text-xs text-neutral-700 mt-2 font-medium">View build →</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Client detail — shown when a client is clicked */}
        <div className={`lg:col-span-2 ${!selected ? "hidden lg:block" : ""}`}>
          {selected ? (
            <div className="space-y-4">
              <button
                onClick={closeClient}
                className="lg:hidden text-sm text-neutral-700 hover:text-neutral-900 font-medium flex items-center gap-1 mb-2"
              >
                ← Back to clients
              </button>

              <div className="bg-surface-card border border-border rounded-xl overflow-hidden">
                {/* Header + tabs */}
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
                            {Object.entries(BUILD_STATUSES).map(([key, val]) => (
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

                      <button
                        onClick={() => setActiveTab("chat")}
                        className="mt-6 w-full py-2.5 border border-border text-neutral-700 hover:bg-neutral-50 rounded-lg text-sm font-medium transition-colors"
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
                Select a client from the list to view their build.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
