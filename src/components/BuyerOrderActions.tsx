"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { BuildRequest } from "@/lib/types";
import { CloseReasonForm } from "@/components/OutcomeNotice";

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
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const supabase = useMemo(() => createClient(), []);

  const canCancel =
    request.status === "pending" || request.status === "in_progress";

  async function handleCancel() {
    const reason = cancelReason.trim();
    if (!reason) {
      setError("Write a reason before cancelling this request.");
      return;
    }

    setLoading(true);
    setError("");

    const { data, error: updateError } = await supabase
      .from("build_requests")
      .update({
        status: "cancelled",
        decline_reason: reason,
        closed_by: "buyer",
        outcome_acknowledged: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", request.id)
      .in("status", ["pending", "in_progress"])
      .select("*")
      .maybeSingle();

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    if (!data || data.status !== "cancelled") {
      setError(
        "Could not cancel your order. Run outcome-ack.sql in Supabase, then try again."
      );
      setLoading(false);
      return;
    }

    onUpdated(data as BuildRequest);
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

      {canCancel &&
        (showCancelForm ? (
          <CloseReasonForm
            label="Why are you cancelling this request?"
            placeholder="This reason will be shown to your builder."
            confirmLabel="Confirm cancel"
            confirming={loading}
            value={cancelReason}
            error={error}
            onChange={setCancelReason}
            onConfirm={handleCancel}
            onCancel={() => {
              setShowCancelForm(false);
              setCancelReason("");
              setError("");
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setShowCancelForm(true);
              setError("");
            }}
            disabled={loading}
            className="w-full py-2.5 border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel Request
          </button>
        ))}

      {error && !showCancelForm && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}
