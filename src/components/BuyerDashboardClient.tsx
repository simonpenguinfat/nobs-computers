"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { BuildRequest } from "@/lib/types";
import { isArchivedStatus } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import BuyerSurvey from "./BuyerSurvey";
import BuildStatusCard from "./BuildStatusCard";
import BuyerSettings from "./BuyerSettings";
import ChatBox from "./ChatBox";
import PendingDraftSubmit from "./PendingDraftSubmit";
import BuyerBuildQuotes from "./BuyerBuildQuotes";

interface BuyerDashboardProps {
  userId: string;
  userName: string;
  userEmail: string;
  memberSince: string;
  initialRequest: BuildRequest | null;
  initialDeclined: BuildRequest | null;
}

type DetailTab = "current" | "chat" | "update" | "settings";

function normalizeRequest(request: BuildRequest | null): BuildRequest | null {
  if (!request || isArchivedStatus(request.status)) {
    return null;
  }
  return request;
}

function noticeForStatus(status: BuildRequest["status"]): string | null {
  if (status === "cancelled") {
    return "This build was cancelled. You can submit a new request below.";
  }
  if (status === "confirmed") {
    return "Delivery confirmed. You can start a new request when you're ready.";
  }
  if (status === "in_progress") {
    return "Your request was accepted — we're working on your build.";
  }
  return null;
}

function DeclinedNotice({ request }: { request: BuildRequest }) {
  const reason = request.decline_reason?.trim();

  return (
    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
      <p className="text-sm font-semibold text-red-950">Your request was declined</p>
      {reason ? (
        <p className="mt-2 text-sm text-red-900 whitespace-pre-wrap">{reason}</p>
      ) : (
        <p className="mt-2 text-sm text-red-800">
          No additional reason was provided.
        </p>
      )}
      <p className="mt-2 text-sm text-red-800">
        You can submit a new request from Update Build.
      </p>
    </div>
  );
}

export default function BuyerDashboardClient({
  userId,
  userName: initialUserName,
  userEmail,
  memberSince,
  initialRequest,
  initialDeclined,
}: BuyerDashboardProps) {
  const supabase = useMemo(() => createClient(), []);
  const [request, setRequest] = useState<BuildRequest | null>(
    normalizeRequest(initialRequest)
  );
  const [declinedRequest, setDeclinedRequest] = useState<BuildRequest | null>(
    normalizeRequest(initialRequest) ? null : initialDeclined
  );
  const [userName, setUserName] = useState(initialUserName);
  const [activeTab, setActiveTab] = useState<DetailTab>(
    normalizeRequest(initialRequest) ? "current" : "update"
  );
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const requestRef = useRef(request);
  requestRef.current = request;

  function applyRemoteRequest(updated: BuildRequest) {
    const previous = requestRef.current;

    if (updated.status === "rejected") {
      setRequest(null);
      setDeclinedRequest(updated);
      setStatusNotice(null);
      setActiveTab("update");
      return;
    }

    if (isArchivedStatus(updated.status)) {
      setRequest(null);
      setActiveTab("update");
      setStatusNotice(noticeForStatus(updated.status));
      return;
    }

    setRequest(updated);
    setDeclinedRequest(null);

    if (
      updated.status === "in_progress" &&
      previous?.status === "pending"
    ) {
      setStatusNotice(noticeForStatus("in_progress"));
    }
  }

  function handleRequestUpdated(updated: BuildRequest | null) {
    if (updated?.status === "rejected") {
      setRequest(null);
      setDeclinedRequest(updated);
      setStatusNotice(null);
      setActiveTab("update");
      return;
    }

    setRequest(normalizeRequest(updated));
    if (!updated || isArchivedStatus(updated.status)) {
      setActiveTab("update");
      if (updated) {
        setStatusNotice(noticeForStatus(updated.status));
      }
    }
  }

  function handleRequestSubmitted(newRequest: BuildRequest) {
    const active = normalizeRequest(newRequest);
    setRequest(active);
    setDeclinedRequest(null);
    setStatusNotice(null);
    if (active) {
      setActiveTab("current");
    }
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
              {request?.status === "pending" && (
                <span className="ml-1.5 text-amber-600">●</span>
              )}
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
          {declinedRequest && <DeclinedNotice request={declinedRequest} />}

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
              {declinedRequest && !request ? (
                <p className="text-sm text-neutral-500">
                  Open Update Build to submit a new request.
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
