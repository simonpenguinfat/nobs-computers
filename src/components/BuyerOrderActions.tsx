"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { BuildRequest } from "@/lib/types";

interface BuyerOrderActionsProps {
  request: BuildRequest;
  onUpdated: (request: BuildRequest | null) => void;
}

export default function BuyerOrderActions({
  request,
  onUpdated,
}: BuyerOrderActionsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = useMemo(() => createClient(), []);

  const canCancel =
    request.status === "pending" || request.status === "in_progress";

  async function handleCancel() {
    if (!confirm("Cancel this build request? This cannot be undone.")) {
      return;
    }

    setLoading(true);
    setError("");

    const { error: updateError } = await supabase
      .from("build_requests")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", request.id)
      .in("status", ["pending", "in_progress"]);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    onUpdated(null);
    setLoading(false);
  }

  return (
    <div className="space-y-3">
      {request.status === "pending" && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm font-medium text-amber-900">Waiting for review</p>
          <p className="text-sm text-amber-800 mt-1">
            Chat with us below while we review your request. We&apos;ll accept or
            decline once we&apos;ve discussed your build.
          </p>
        </div>
      )}

      {canCancel && (
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="w-full py-2.5 border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
        >
          {loading ? "Cancelling..." : "Cancel Request"}
        </button>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}
