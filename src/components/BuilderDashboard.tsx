"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BUILD_STATUSES, isArchivedStatus, needsAdminOutcomeAck, staysOnAdminDashboard } from "@/lib/types";
import type { BuildRequest, Profile } from "@/lib/types";
import ChatBox from "./ChatBox";
import BuildQuoteEditor, { type BuildQuoteEditorHandle } from "./BuildQuoteEditor";
import OwnedPartsSummary from "./OwnedPartsSummary";
import OutcomeNotice, { CloseReasonForm } from "./OutcomeNotice";

interface ClientWithProfile extends BuildRequest {
  profiles: Profile;
}

interface BuilderDashboardProps {
  clients: ClientWithProfile[];
  builderId: string;
  builderName: string;
}

type DetailTab = "drafts" | "parts" | "chat";

export default function BuilderDashboard({
  clients: initialClients,
  builderId,
  builderName,
}: BuilderDashboardProps) {
  const [clients, setClients] = useState(() =>
    initialClients.filter((client) => staysOnAdminDashboard(client))
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>("drafts");
  const [updating, setUpdating] = useState(false);
  const [actionError, setActionError] = useState("");
  const [saveOk, setSaveOk] = useState(false);
  const [draftStatus, setDraftStatus] = useState<BuildRequest["status"]>("pending");
  const [draftEstimate, setDraftEstimate] = useState("");
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [closeReason, setCloseReason] = useState("");
  const quoteEditorRef = useRef<BuildQuoteEditorHandle>(null);
  const supabase = useMemo(() => createClient(), []);

  const selected = clients.find((c) => c.id === selectedId) ?? null;

  function removeClient(requestId: string) {
    setClients((prev) => prev.filter((c) => c.id !== requestId));
    setSelectedId(null);
    setActiveTab("drafts");
  }

  function openClient(clientId: string) {
    const client = clients.find((c) => c.id === clientId);
    setSelectedId(clientId);
    setActiveTab(client?.status === "pending" ? "parts" : "drafts");
    if (client) {
      setDraftStatus(client.status);
      setDraftEstimate(
        client.estimated_cost != null ? String(client.estimated_cost) : ""
      );
    }
    setSaveOk(false);
    setActionError("");
    setShowDeclineForm(false);
    setShowCancelForm(false);
    setCloseReason("");
  }

  function closeClient() {
    setSelectedId(null);
    setActiveTab("drafts");
    setShowDeclineForm(false);
    setShowCancelForm(false);
    setCloseReason("");
  }

  function formatStatusError(message: string): string {
    const lower = message.toLowerCase();

    if (lower.includes("check constraint") || lower.includes("rejected")) {
      return "Decline failed — run fix-decline-order.sql in Supabase SQL Editor, then try again.";
    }

    if (lower.includes("permission denied") || lower.includes("row-level security")) {
      return "Permission denied. Make sure your account has the builder role in Supabase.";
    }

    if (
      lower.includes("decline_reason") ||
      lower.includes("closed_by") ||
      lower.includes("outcome_acknowledged")
    ) {
      return "Run outcome-ack.sql in the Supabase SQL Editor, then try again.";
    }

    if (
      lower.includes("needs_review") ||
      lower.includes("review_kind") ||
      lower.includes("schema cache")
    ) {
      return "Alerts aren't set up yet. Run request-review-alerts.sql in the Supabase SQL Editor, then refresh.";
    }

    return message;
  }

  async function updateStatus(
    requestId: string,
    status: BuildRequest["status"],
    options?: {
      onlyFromStatus?: BuildRequest["status"];
      extra?: Record<string, unknown>;
    }
  ): Promise<boolean> {
    setUpdating(true);
    setActionError("");

    if (status === "not_received") {
      setActionError("Only the customer can mark a build as not received.");
      setUpdating(false);
      return false;
    }

    let query = supabase
      .from("build_requests")
      .update({
        status,
        updated_at: new Date().toISOString(),
        ...(options?.extra ?? {}),
      })
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
      setActiveTab("drafts");
    }
  }

  async function declineOrder(requestId: string) {
    const reason = closeReason.trim();
    if (!reason) {
      setActionError("Write a reason before declining this request.");
      return;
    }

    const ok = await updateStatus(requestId, "rejected", {
      onlyFromStatus: "pending",
      extra: {
        decline_reason: reason,
        closed_by: "builder",
        outcome_acknowledged: false,
      },
    });
    if (ok) {
      setShowDeclineForm(false);
      setCloseReason("");
    }
  }

  async function cancelOrder(requestId: string) {
    const reason = closeReason.trim();
    if (!reason) {
      setActionError("Write a reason before cancelling this request.");
      return;
    }

    const ok = await updateStatus(requestId, "cancelled", {
      extra: {
        decline_reason: reason,
        closed_by: "builder",
        outcome_acknowledged: false,
      },
    });
    if (ok) {
      setShowCancelForm(false);
      setCloseReason("");
    }
  }

  async function acknowledgeOutcome(requestId: string) {
    setUpdating(true);
    setActionError("");

    const { data, error } = await supabase
      .from("build_requests")
      .update({
        outcome_acknowledged: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .select("*")
      .maybeSingle();

    if (error) {
      setActionError(formatStatusError(error.message));
      setUpdating(false);
      return;
    }

    if (data) {
      removeClient(requestId);
    }
    setUpdating(false);
  }

  async function markReviewed(requestId: string) {
    setUpdating(true);
    setActionError("");

    const { data, error } = await supabase
      .from("build_requests")
      .update({
        needs_review: false,
        review_kind: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .select("*")
      .maybeSingle();

    if (error) {
      setActionError(formatStatusError(error.message));
      setUpdating(false);
      return;
    }

    if (data) {
      setClients((prev) =>
        prev.map((c) =>
          c.id === requestId ? { ...c, ...(data as BuildRequest) } : c
        )
      );
    }

    setUpdating(false);
  }

  async function saveChanges() {
    if (!selected) return;

    setUpdating(true);
    setActionError("");
    setSaveOk(false);

    const draftError = await quoteEditorRef.current?.saveAll();
    if (draftError) {
      setActionError(draftError);
      setUpdating(false);
      return;
    }

    const payload: {
      updated_at: string;
      estimated_cost?: number | null;
      status?: BuildRequest["status"];
    } = {
      updated_at: new Date().toISOString(),
    };

    const estimate = draftEstimate.trim() === "" ? null : parseFloat(draftEstimate);
    if (draftEstimate.trim() !== "" && (estimate == null || Number.isNaN(estimate))) {
      setActionError("Enter a valid estimated cost, or leave it blank.");
      setUpdating(false);
      return;
    }
    payload.estimated_cost = estimate == null || Number.isNaN(estimate) ? null : estimate;

    if (selected.status !== "pending") {
      if (draftStatus === "not_received") {
        setActionError("Only the customer can mark a build as not received.");
        setUpdating(false);
        return;
      }

      if (draftStatus === "cancelled") {
        if (!confirm("Cancel this order? It will be removed from your dashboard.")) {
          setUpdating(false);
          return;
        }
      }

      payload.status = draftStatus;
    }

    const { data, error } = await supabase
      .from("build_requests")
      .update(payload)
      .eq("id", selected.id)
      .select("*")
      .maybeSingle();

    if (error) {
      setActionError(formatStatusError(error.message));
      setUpdating(false);
      return;
    }

    if (!data) {
      setActionError(
        "Could not save this order. It may have already changed — refresh the page."
      );
      setUpdating(false);
      return;
    }

    const nextStatus = (data as BuildRequest).status;
    if (isArchivedStatus(nextStatus)) {
      removeClient(selected.id);
    } else {
      setClients((prev) =>
        prev.map((c) => {
          if (c.id !== selected.id) return c;
          return { ...c, ...(data as BuildRequest) };
        })
      );
      setDraftStatus(nextStatus);
      setDraftEstimate(
        data.estimated_cost != null ? String(data.estimated_cost) : ""
      );
      setSaveOk(true);
    }

    setUpdating(false);
  }

  const workingClients = clients.filter((c) => !isArchivedStatus(c.status));
  const pendingCount = workingClients.filter((c) => c.status === "pending").length;
  const activeCount = workingClients.filter((c) => c.status === "in_progress").length;
  const issueCount = workingClients.filter((c) => c.status === "not_received").length;
  const alertCount = workingClients.filter((c) => c.needs_review).length;
  const sortedClients = [...clients].sort((a, b) => {
    const aAck = needsAdminOutcomeAck(a);
    const bAck = needsAdminOutcomeAck(b);
    if (aAck !== bAck) return aAck ? -1 : 1;
    if (!!a.needs_review !== !!b.needs_review) {
      return a.needs_review ? -1 : 1;
    }
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  useEffect(() => {
    const channel = supabase
      .channel("admin-build-requests")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "build_requests",
        },
        async (payload) => {
          const inserted = payload.new as BuildRequest;
          if (isArchivedStatus(inserted.status)) return;

          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", inserted.buyer_id)
            .maybeSingle();

          setClients((prev) => {
            if (prev.some((c) => c.id === inserted.id)) {
              return prev.map((c) =>
                c.id === inserted.id ? { ...c, ...inserted } : c
              );
            }
            return [
              {
                ...inserted,
                profiles: (profile as Profile) ?? {
                  id: inserted.buyer_id,
                  email: "",
                  full_name: "New customer",
                  role: "buyer",
                  created_at: inserted.created_at,
                },
              },
              ...prev,
            ];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "build_requests",
        },
        async (payload) => {
          const incoming = payload.new as BuildRequest;
          if (!incoming?.id) return;

          const { data } = await supabase
            .from("build_requests")
            .select("*")
            .eq("id", incoming.id)
            .maybeSingle();

          const updated = (data as BuildRequest | null) ?? incoming;

          if (needsAdminOutcomeAck(updated)) {
            setClients((prev) => {
              const exists = prev.some((c) => c.id === updated.id);
              if (exists) {
                return prev.map((c) =>
                  c.id === updated.id ? { ...c, ...updated } : c
                );
              }
              return prev;
            });
            return;
          }

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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
        <div className="bg-surface-card border border-border rounded-xl p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-neutral-900">{workingClients.length}</p>
          <p className="text-xs text-neutral-500 mt-1">Active Orders</p>
        </div>
        <div className="bg-surface-card border border-border rounded-xl p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-amber-600">{alertCount}</p>
          <p className="text-xs text-neutral-500 mt-1">Alerts</p>
        </div>
        <div className="bg-surface-card border border-border rounded-xl p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-neutral-700">{pendingCount}</p>
          <p className="text-xs text-neutral-500 mt-1">Awaiting Accept</p>
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
              {sortedClients.map((client) => {
                const statusInfo = BUILD_STATUSES[client.status];
                const isSelected = client.id === selectedId;
                const alertLabel =
                  client.review_kind === "updated"
                    ? "Request updated"
                    : client.needs_review
                      ? "New request"
                      : null;
                const awaitingAck = needsAdminOutcomeAck(client);
                return (
                  <button
                    key={client.id}
                    onClick={() => openClient(client.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      isSelected
                        ? "border-neutral-900 bg-neutral-50"
                        : awaitingAck
                          ? "border-red-300 bg-red-50 hover:border-red-400"
                        : client.needs_review
                          ? "border-amber-400 bg-amber-50 hover:border-amber-500"
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
                    {awaitingAck ? (
                      <p className="text-xs text-red-800 mt-2 font-semibold">
                        Customer cancelled — confirm
                      </p>
                    ) : alertLabel ? (
                      <p className="text-xs text-amber-800 mt-2 font-semibold">
                        ● {alertLabel}
                      </p>
                    ) : null}
                    <p className="text-xs text-neutral-700 mt-2 font-medium">
                      {awaitingAck
                        ? "View reason →"
                        : client.status === "pending"
                          ? "Review & chat →"
                          : "View build →"}
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

              <div className="bg-surface-card border border-border rounded-xl">
                <div className="px-4 sm:px-5 pt-5 pb-0 border-b border-border bg-white">
                  <h2 className="font-semibold mb-4 text-neutral-900">
                    {selected.profiles?.full_name || "Client"}&apos;s Build
                  </h2>
                  <div className="flex gap-1 overflow-x-auto">
                    <button
                      type="button"
                      onClick={() => setActiveTab("drafts")}
                      className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                        activeTab === "drafts"
                          ? "bg-neutral-50 text-neutral-900 border-b-2 border-neutral-900"
                          : "text-neutral-500 hover:text-neutral-700"
                      }`}
                    >
                      PC Drafts
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("parts")}
                      className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                        activeTab === "parts"
                          ? "bg-neutral-50 text-neutral-900 border-b-2 border-neutral-900"
                          : "text-neutral-500 hover:text-neutral-700"
                      }`}
                    >
                      Existing Parts
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("chat")}
                      className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
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
                  {needsAdminOutcomeAck(selected) && (
                    <OutcomeNotice
                      title="The customer cancelled this request"
                      reason={selected.decline_reason}
                      confirming={updating}
                      onConfirm={() => acknowledgeOutcome(selected.id)}
                    />
                  )}

                  {selected.needs_review && !needsAdminOutcomeAck(selected) && (
                    <div className="mb-4 bg-amber-50 border border-amber-300 rounded-lg p-4 space-y-3">
                      <p className="text-sm font-semibold text-amber-950">
                        {selected.review_kind === "updated"
                          ? "Customer updated their request"
                          : "New build request"}
                      </p>
                      <p className="text-sm text-amber-900">
                        {selected.review_kind === "updated"
                          ? "Review the latest use case, budget, parts, and notes. Suggested builds, chat, and status were kept."
                          : "A new customer submitted a build request. Review the details, then chat and accept or decline."}
                      </p>
                      <button
                        type="button"
                        onClick={() => markReviewed(selected.id)}
                        disabled={updating}
                        className="w-full sm:w-auto px-4 py-2 bg-amber-800 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg"
                      >
                        {updating ? "Saving…" : "Mark as reviewed"}
                      </button>
                    </div>
                  )}

                  <div className={activeTab === "drafts" ? "" : "hidden"}>
                      {needsAdminOutcomeAck(selected) ? (
                        <p className="text-sm text-neutral-500">
                          Confirm the cancellation above to remove this order from your dashboard.
                        </p>
                      ) : (
                      <>
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

                      <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-end mb-4">
                        {selected.status !== "pending" && (
                          <div className="flex-1 sm:flex-none">
                            <label className="text-xs text-neutral-500 block mb-1">
                              Status
                            </label>
                            <select
                              value={draftStatus}
                              disabled={updating}
                              onChange={(e) => {
                                setDraftStatus(e.target.value as BuildRequest["status"]);
                                setSaveOk(false);
                              }}
                              className="w-full sm:w-auto bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neutral-400"
                            >
                              {Object.entries(BUILD_STATUSES)
                                .filter(([key]) => {
                                  if (["confirmed", "rejected", "pending"].includes(key)) {
                                    return false;
                                  }
                                  if (key === "not_received") {
                                    return selected.status === "not_received";
                                  }
                                  return true;
                                })
                                .map(([key, val]) => (
                                  <option key={key} value={key}>
                                    {val.label}
                                  </option>
                                ))}
                            </select>
                          </div>
                        )}
                        <div className="flex-1 sm:flex-none">
                          <label className="text-xs text-neutral-500 block mb-1">
                            Estimated Cost (CAD)
                          </label>
                          <input
                            type="number"
                            value={draftEstimate}
                            onChange={(e) => {
                              setDraftEstimate(e.target.value);
                              setSaveOk(false);
                            }}
                            placeholder="Enter quote"
                            className="w-full sm:w-36 bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neutral-400"
                          />
                        </div>
                      </div>

                      {actionError && (
                        <p className="text-sm text-red-700 mb-3">{actionError}</p>
                      )}

                      <BuildQuoteEditor
                        key={selected.id}
                        ref={quoteEditorRef}
                        buildRequestId={selected.id}
                        onUseAsEstimate={(total) => {
                          setDraftEstimate(total.toFixed(2));
                          setSaveOk(false);
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => saveChanges()}
                        disabled={updating}
                        className="mt-4 w-full py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors"
                      >
                        {updating ? "Saving…" : "Save changes"}
                      </button>
                      {saveOk && (
                        <p className="text-sm text-green-700 mt-2 text-center">
                          Changes saved.
                        </p>
                      )}

                      {selected.status !== "pending" &&
                        !needsAdminOutcomeAck(selected) &&
                        (showCancelForm ? (
                          <div className="mt-4">
                            <CloseReasonForm
                              label="Why are you cancelling this request?"
                              placeholder="This reason will be shown to the customer."
                              confirmLabel="Confirm cancel"
                              confirming={updating}
                              value={closeReason}
                              error={actionError}
                              onChange={setCloseReason}
                              onConfirm={() => cancelOrder(selected.id)}
                              onCancel={() => {
                                setShowCancelForm(false);
                                setCloseReason("");
                                setActionError("");
                              }}
                            />
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setShowCancelForm(true);
                              setShowDeclineForm(false);
                              setActionError("");
                            }}
                            disabled={updating}
                            className="mt-4 w-full py-2.5 border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
                          >
                            Cancel Order
                          </button>
                        ))}
                      </>
                      )}
                    </div>

                  {activeTab === "parts" && (
                    <>
                      <div className="space-y-6 mb-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div className="space-y-1.5">
                            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                              Use Case
                            </p>
                            <p className="text-sm text-neutral-900 leading-relaxed">
                              {selected.use_case || "—"}
                            </p>
                          </div>
                          <div className="space-y-1.5">
                            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                              Budget
                            </p>
                            <p className="text-sm text-neutral-900 leading-relaxed">
                              ${selected.budget?.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                            Preferences
                          </p>
                          {(() => {
                            const lines = (selected.preferences || "")
                              .split("\n")
                              .map((line) => line.trim())
                              .filter(Boolean);

                            if (lines.length === 0) {
                              return (
                                <p className="text-sm text-neutral-500">None</p>
                              );
                            }

                            return (
                              <div className="space-y-3 rounded-lg border border-border bg-neutral-50 px-4 py-3.5">
                                {lines.map((line, index) => {
                                  const sep = line.indexOf(":");
                                  const hasLabel = sep > 0 && sep < 40;
                                  const label = hasLabel
                                    ? line.slice(0, sep).trim()
                                    : null;
                                  const value = hasLabel
                                    ? line.slice(sep + 1).trim()
                                    : line;

                                  return (
                                    <div
                                      key={`${index}-${line.slice(0, 24)}`}
                                      className="space-y-1"
                                    >
                                      {label ? (
                                        <p className="text-xs text-neutral-500">
                                          {label}
                                        </p>
                                      ) : null}
                                      <p className="text-sm text-neutral-900 leading-relaxed whitespace-pre-wrap">
                                        {value || "—"}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>

                        <div className="pt-1">
                          <OwnedPartsSummary raw={selected.existing_parts} />
                        </div>
                      </div>

                      {selected.status === "pending" && (
                        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                          <p className="text-sm text-amber-900">
                            <strong>Review this order.</strong> Chat with the customer first,
                            then accept or decline.
                          </p>
                          {actionError && !showDeclineForm && (
                            <p className="text-sm text-red-700">{actionError}</p>
                          )}
                          {showDeclineForm ? (
                            <CloseReasonForm
                              label="Why are you declining this request?"
                              placeholder="This reason will be shown to the customer."
                              confirmLabel="Confirm decline"
                              confirming={updating}
                              value={closeReason}
                              error={actionError}
                              onChange={setCloseReason}
                              onConfirm={() => declineOrder(selected.id)}
                              onCancel={() => {
                                setShowDeclineForm(false);
                                setCloseReason("");
                                setActionError("");
                              }}
                            />
                          ) : (
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
                                onClick={() => {
                                  setShowDeclineForm(true);
                                  setShowCancelForm(false);
                                  setActionError("");
                                }}
                                disabled={updating}
                                className="flex-1 py-2.5 border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50 font-medium rounded-lg text-sm transition-colors"
                              >
                                Decline Order
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {activeTab === "chat" && (
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
