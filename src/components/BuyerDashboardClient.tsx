"use client";

import { useState } from "react";
import type { BuildRequest } from "@/lib/types";
import BuyerSurvey from "./BuyerSurvey";
import BuildStatusCard from "./BuildStatusCard";
import ChatBox from "./ChatBox";

interface BuyerDashboardProps {
  userId: string;
  userName: string;
  initialRequest: BuildRequest | null;
}

type MobileTab = "survey" | "status";

export default function BuyerDashboardClient({
  userId,
  userName,
  initialRequest,
}: BuyerDashboardProps) {
  const [request, setRequest] = useState<BuildRequest | null>(initialRequest);
  const [mobileTab, setMobileTab] = useState<MobileTab>(
    initialRequest ? "status" : "survey"
  );

  function handleRequestUpdated(updated: BuildRequest | null) {
    setRequest(updated);
    if (!updated) {
      setMobileTab("survey");
    }
  }

  function handleRequestSubmitted(newRequest: BuildRequest) {
    setRequest(newRequest);
    setMobileTab("status");
  }

  return (
    <div className="space-y-4">
      <div className="flex lg:hidden border border-border rounded-lg p-1 bg-surface-light">
        <button
          onClick={() => setMobileTab("survey")}
          className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors ${
            mobileTab === "survey"
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-500"
          }`}
        >
          Your Request
        </button>
        <button
          onClick={() => setMobileTab("status")}
          className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors ${
            mobileTab === "status"
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-500"
          }`}
        >
          Status & Chat
        </button>
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
    </div>
  );
}
