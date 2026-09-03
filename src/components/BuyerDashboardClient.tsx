"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { BuildRequest } from "@/lib/types";
import {
  isArchivedStatus,
  needsBuyerOutcomeAck,
} from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import BuyerSurvey from "./BuyerSurvey";
import BuildStatusCard from "./BuildStatusCard";
import BuyerSettings from "./BuyerSettings";
import ChatBox from "./ChatBox";
import PendingDraftSubmit from "./PendingDraftSubmit";
import BuyerBuildQuotes from "./BuyerBuildQuotes";
import OutcomeNotice from "./OutcomeNotice";
import BuildProgressBar from "./BuildProgressBar";

interface BuyerDashboardProps {
  userId: string;
  userName: string;
  userEmail: string;
  memberSince: string;
  initialRequest: BuildRequest | null;
  initialOutcome: BuildRequest | null;
}

type DetailTab = "current" | "chat" | "update" | "settings";

function normalizeRequest(request: BuildRequest | null): BuildRequest | null {
  if (!request || isArchivedStatus(request.status)) {
    return null;
  }
  return request;
}

function noticeForStatus(status: BuildRequest["status"]): string | null {
  if (status === "confirmed") {
    return "Delivery confirmed. You can start a new request when you're ready.";
  }
  if (status === "in_progress") {
    return "Your request was accepted — we're working on your build.";
  }
  return null;
}

function buyerOutcomeTitle(request: BuildRequest): string {
  return request.status === "cancelled"
    ? "Your request was cancelled"
    : "Your request was declined";
}

export default function BuyerDashboardClient({
  userId,
  userName: initialUserName,
  userEmail,
  memberSince,
  initialRequest,
  initialOutcome,
}: BuyerDashboardProps) {
  const supabase = useMemo(() => createClient(), []);
  const [request, setRequest] = useState<BuildRequest | null>(
    normalizeRequest(initialRequest)
  );
  const [outcomeRequest, setOutcomeRequest] = useState<BuildRequest | null>(
    needsBuyerOutcomeAck(initialOutcome)
      ? initialOutcome
      : needsBuyerOutcomeAck(initialRequest)
        ? initialRequest
        : null
  );
  const [userName, setUserName] = useState(initialUserName);
  const [activeTab, setActiveTab] = useState<DetailTab>(
    normalizeRequest(initialRequest) ? "current" : "update"
  );
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [acking, setAcking] = useState(false);
  const requestRef = useRef(request);
  requestRef.current = request;

  function applyRemoteRequest(updated: BuildRequest) {
    const previous = requestRef.current;

    if (needsBuyerOutcomeAck(updated)) {
      setRequest(null);
      setOutcomeRequest(updated);
      setStatusNotice(null);
      setActiveTab("update");
      return;
    }

    if (isArchivedStatus(updated.status)) {
      setRequest(null);
      setOutcomeRequest((current) =>
        updated.outcome_acknowledged && current?.id === updated.id
          ? null
          : current
      );
      setActiveTab("update");
      const notice = noticeForStatus(updated.status);
      if (notice) setStatusNotice(notice);
      return;
    }

    setRequest(updated);

    if (
      updated.status === "in_progress" &&
      previous?.status === "pending"
    ) {
      setStatusNotice(noticeForStatus("in_progress"));
    }
  }

  function handleRequestUpdated(updated: BuildRequest | null) {
    if (needsBuyerOutcomeAck(updated)) {
      setRequest(null);
      setOutcomeRequest(updated);
      setStatusNotice(null);
      setActiveTab("update");
      return;
    }

    setRequest(normalizeRequest(updated));
    if (!updated || isArchivedStatus(updated.status)) {
      setActiveTab("update");
      if (updated) {
        const notice = noticeForStatus(updated.status);
        if (notice) setStatusNotice(notice);
      }
    }
  }

  function handleRequestSubmitted(newRequest: BuildRequest) {
    const active = normalizeRequest(newRequest);
    setRequest(active);
    setStatusNotice(null);
    if (active) {
      setActiveTab("current");
    }
  }

  async function acknowledgeOutcome() {
    if (!outcomeRequest) return;
    setAcking(true);

    const { data, error } = await supabase
      .from("build_requests")
      .update({
        outcome_acknowledged: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", outcomeRequest.id)
      .select("*")
      .maybeSingle();

    if (!error && data) {
      setOutcomeRequest(null);
    }
    setAcking(false);
  }

  useEffect(() => {
    const channel = supabase
      .channel(`buyer-build-request-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "build_requests",
          filter: `buyer_id=eq.${userId}`,
        },
        async (payload) => {
          if (payload.eventType === "DELETE") {
            setRequest(null);
            setActiveTab("update");
            return;
          }

          const incoming = payload.new as BuildRequest | undefined;
          if (!incoming?.id) return;

          const { data } = await supabase
            .from("build_requests")
            .select("*")
            .eq("id", incoming.id)
            .maybeSingle();

          applyRemoteRequest((data as BuildRequest | null) ?? incoming);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  const tabClass = (tab: DetailTab) =>
    `px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
      activeTab === tab
        ? "bg-neutral-50 text-neutral-900 border-b-2 border-neutral-900"
        : "text-neutral-500 hover:text-neutral-700"
    }`;

  return (
    <div className="space-y-4">
      <div className="mb-2 sm:mb-4 space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">My Build</h1>
            <p className="text-neutral-500 text-sm mt-1">
              Tell us what you need and track your custom PC build.
            </p>
          </div>
          <div className="w-full lg:w-auto lg:min-w-[14rem] rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
              Estimated price
            </p>
            <p className="text-2xl font-bold text-neutral-950 mt-0.5 tabular-nums">
              {request?.estimated_cost != null
                ? `$${request.estimated_cost.toLocaleString()} CAD`
                : "Pending quote"}
            </p>
            {request?.budget ? (
              <p className="text-xs text-neutral-600 mt-1">
                Your budget: ${request.budget.toLocaleString()} CAD
              </p>
            ) : null}
          </div>
        </div>
        <BuildProgressBar request={request} />
      </div>

      <PendingDraftSubmit />

      <div className="bg-surface-card border border-border rounded-xl">
        <div className="px-4 sm:px-5 pt-5 pb-0 border-b border-border bg-white rounded-t-xl">
          <div className="flex gap-1 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("current")}
              className={tabClass("current")}
            >
              Current Build
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("chat")}
              className={tabClass("chat")}
            >
              Chat
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("update")}
              className={tabClass("update")}
            >
              Update Build
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className={tabClass("settings")}
            >
              Settings
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-white rounded-b-xl overflow-visible">
          {outcomeRequest && needsBuyerOutcomeAck(outcomeRequest) && (
            <OutcomeNotice
              title={buyerOutcomeTitle(outcomeRequest)}
              reason={outcomeRequest.decline_reason}
              confirming={acking}
              onConfirm={acknowledgeOutcome}
            />
          )}

          {statusNotice && (
            <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-border bg-neutral-50 px-3 py-2.5">
              <p className="text-sm text-neutral-800">{statusNotice}</p>
              <button
                type="button"
                onClick={() => setStatusNotice(null)}
                className="shrink-0 text-neutral-400 hover:text-neutral-700 text-sm"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          )}

          {activeTab === "current" && (
            <div className="space-y-4 sm:space-y-6">
              {outcomeRequest && needsBuyerOutcomeAck(outcomeRequest) && !request ? (
                <p className="text-sm text-neutral-500">
                  Confirm above, then open Update Build to submit a new request.
                </p>
              ) : (
                <>
                  <BuildStatusCard
                    request={request}
                    onRequestUpdated={handleRequestUpdated}
                  />
                  {request ? (
                    <BuyerBuildQuotes buildRequestId={request.id} />
                  ) : (
                    <p className="text-sm text-neutral-500">
                      No active build yet. Open Update Build to submit a request.
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {request && (
            <div className={activeTab === "chat" ? "" : "hidden"}>
              <ChatBox
                key={request.id}
                buildRequestId={request.id}
                userId={userId}
                userName={userName}
              />
            </div>
          )}

          {activeTab === "chat" && !request && (
            <div className="py-8 text-center">
              <p className="text-neutral-500 text-sm">
                Submit your request first to unlock chat with your builder.
              </p>
            </div>
          )}

          {activeTab === "update" && (
            <div>
              <h3 className="font-semibold mb-4 text-neutral-900">
                {request ? "Update Build" : "Tell Us What You Need"}
              </h3>
              <BuyerSurvey
                key={request?.id ?? "new"}
                userId={userId}
                existingRequest={request}
                onSubmitted={handleRequestSubmitted}
              />
            </div>
          )}

          {activeTab === "settings" && (
            <BuyerSettings
              userId={userId}
              email={userEmail}
              fullName={userName}
              memberSince={memberSince}
              onNameUpdated={setUserName}
            />
          )}
        </div>
      </div>
    </div>
  );
}
