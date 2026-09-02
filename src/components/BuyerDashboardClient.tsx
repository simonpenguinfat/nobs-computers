"use client";

import { useState } from "react";
import type { BuildRequest } from "@/lib/types";
import { isArchivedStatus } from "@/lib/types";
import BuyerSurvey from "./BuyerSurvey";
import BuildStatusCard from "./BuildStatusCard";
import BuyerSettings from "./BuyerSettings";
import ChatBox from "./ChatBox";

interface BuyerDashboardProps {
  userId: string;
  userName: string;
  userEmail: string;
  memberSince: string;
  initialRequest: BuildRequest | null;
}

type MobileTab = "survey" | "status" | "settings";

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
  const [mobileTab, setMobileTab] = useState<MobileTab>(
    initialRequest && !isArchivedStatus(initialRequest.status) ? "status" : "survey"
  );

  function handleRequestUpdated(updated: BuildRequest | null) {
    setRequest(normalizeRequest(updated));
    if (!updated || isArchivedStatus(updated.status)) {
      setMobileTab("survey");
    }
  }

  function handleRequestSubmitted(newRequest: BuildRequest) {
    const active = normalizeRequest(newRequest);
    setRequest(active);
    if (active) {
      setMobileTab("status");
    }
  }

  const tabClass = (tab: MobileTab) =>
    `flex-1 py-2.5 text-sm font-medium rounded-md transition-colors ${
      mobileTab === tab
        ? "bg-white text-neutral-900 shadow-sm"
        : "text-neutral-500"
    }`;

  const settingsPanel = (
    <BuyerSettings
      userId={userId}
      email={userEmail}
      fullName={userName}
      memberSince={memberSince}
      onNameUpdated={setUserName}
    />
  );

  return (
    <div className="space-y-4">
      <div className="flex lg:hidden border border-border rounded-lg p-1 bg-surface-light">
        <button type="button" onClick={() => setMobileTab("survey")} className={tabClass("survey")}>
          Request
        </button>
        <button type="button" onClick={() => setMobileTab("status")} className={tabClass("status")}>
          Status
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("settings")}
          className={tabClass("settings")}
        >
          Settings
        </button>
      </div>

      <div className={`lg:hidden ${mobileTab !== "settings" ? "hidden" : ""}`}>
        {settingsPanel}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className={`space-y-6 ${mobileTab !== "survey" ? "hidden lg:block" : ""}`}>
          <div className="bg-surface-card border border-border rounded-xl p-5 sm:p-6">
            <h2 className="font-semibold mb-4 text-neutral-900">Tell Us What You Need</h2>
            <BuyerSurvey
              userId={userId}
              existingRequest={request}
              onSubmitted={handleRequestSubmitted}
            />
          </div>
        </div>

        <div className={`space-y-4 sm:space-y-6 ${mobileTab !== "status" ? "hidden lg:block" : ""}`}>
          <BuildStatusCard request={request} onRequestUpdated={handleRequestUpdated} />

          {request ? (
            <ChatBox
              key={request.id}
              buildRequestId={request.id}
              userId={userId}
              userName={userName}
            />
          ) : (
            <div className="bg-surface-card border border-border rounded-xl p-6 text-center">
              <p className="text-neutral-500 text-sm">
                Submit your request first to unlock chat with your builder.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="hidden lg:block max-w-md">{settingsPanel}</div>
    </div>
  );
}
