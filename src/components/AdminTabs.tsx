"use client";

import { useState } from "react";
import BuilderDashboard from "@/components/BuilderDashboard";
import AdminBuildManager from "@/components/AdminBuildManager";
import type { BuildRequest, Profile } from "@/lib/types";

interface ClientWithProfile extends BuildRequest {
  profiles: Profile;
}

interface AdminTabsProps {
  clients: ClientWithProfile[];
  builderId: string;
  builderName: string;
}

type AdminTab = "orders" | "builds";

export default function AdminTabs({
  clients,
  builderId,
  builderName,
}: AdminTabsProps) {
  const [tab, setTab] = useState<AdminTab>("orders");

  return (
    <div className="space-y-6">
      <div className="flex border border-border rounded-lg p-1 bg-white max-w-md">
        <button
          type="button"
          onClick={() => setTab("orders")}
          className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors ${
            tab === "orders"
              ? "bg-neutral-900 text-white"
              : "text-neutral-600 hover:text-neutral-900"
          }`}
        >
          Orders
        </button>
        <button
          type="button"
          onClick={() => setTab("builds")}
          className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors ${
            tab === "builds"
              ? "bg-neutral-900 text-white"
              : "text-neutral-600 hover:text-neutral-900"
          }`}
        >
          Past Builds
        </button>
      </div>

      {tab === "orders" ? (
        <BuilderDashboard
          clients={clients}
          builderId={builderId}
          builderName={builderName}
        />
      ) : (
        <AdminBuildManager />
      )}
    </div>
  );
}
