"use client";

import { useState } from "react";
import type { BuildRequest } from "@/lib/types";
import { isArchivedStatus } from "@/lib/types";
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
}

type DetailTab = "current" | "chat" | "update" | "settings";

function normalizeRequest(request: BuildRequest | null): BuildRequest | null {
  if (!request || isArchivedStatus(request.status)) {
    return null;
  }
  return request;
}

export default function BuyerDashboardClient({
  userId,
  userName: initialUserName,
  userEmail,
  memberSince,
  initialRequest,
}: BuyerDashboardProps) {
  const [request, setRequest] = useState<BuildRequest | null>(
    normalizeRequest(initialRequest)
  );
  const [userName, setUserName] = useState(initialUserName);
  const [activeTab, setActiveTab] = useState<DetailTab>(
    normalizeRequest(initialRequest) ? "current" : "update"
  );

  function handleRequestUpdated(updated: BuildRequest | null) {
    setRequest(normalizeRequest(updated));
    if (!updated || isArchivedStatus(updated.status)) {
      setActiveTab("update");
    }
  }

  function handleRequestSubmitted(newRequest: BuildRequest) {
    const active = normalizeRequest(newRequest);
    setRequest(active);
    if (active) {
      setActiveTab("current");
    }
  }

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
          {activeTab === "current" && (
            <div className="space-y-4 sm:space-y-6">
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
            </div>
          )}

          {activeTab === "chat" &&
            (request ? (
              <ChatBox
                key={request.id}
                buildRequestId={request.id}
                userId={userId}
                userName={userName}
              />
            ) : (
              <div className="py-8 text-center">
                <p className="text-neutral-500 text-sm">
                  Submit your request first to unlock chat with your builder.
                </p>
              </div>
            ))}

          {activeTab === "update" && (
            <div>
              <h3 className="font-semibold mb-4 text-neutral-900">
                {request ? "Update Build" : "Tell Us What You Need"}
              </h3>
              <BuyerSurvey
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
