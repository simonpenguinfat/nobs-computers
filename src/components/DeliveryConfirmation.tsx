"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { BuildRequest } from "@/lib/types";

interface DeliveryConfirmationProps {
  request: BuildRequest;
  onUpdated: (request: BuildRequest | null) => void;
}

export default function DeliveryConfirmation({
  request,
  onUpdated,
}: DeliveryConfirmationProps) {
  const [loading, setLoading] = useState<"confirm" | "not_received" | null>(null);
  const [error, setError] = useState("");
  const supabase = useMemo(() => createClient(), []);

  async function handleConfirm() {
    setLoading("confirm");
    setError("");

    const { data, error: updateError } = await supabase
      .from("build_requests")
      .update({
        status: "confirmed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", request.id)
      .eq("status", "completed")
      .select()
      .single();

    if (updateError) {
      setError(updateError.message);
      setLoading(null);
      return;
    }

    onUpdated(null);
    setLoading(null);
  }

  async function handleNotReceived() {
    setLoading("not_received");
    setError("");

    const { data, error: updateError } = await supabase
      .from("build_requests")
      .update({
        status: "not_received",
        updated_at: new Date().toISOString(),
      })
      .eq("id", request.id)
      .eq("status", "completed")
      .select()
      .single();

    if (updateError) {
      setError(updateError.message);
      setLoading(null);
      return;
    }

    if (data) {
      onUpdated(data as BuildRequest);
    }
    setLoading(null);
  }

  if (request.status !== "completed") {
    return null;
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-5 space-y-4">
      <div>
        <h3 className="font-semibold text-green-900">Your build is ready!</h3>
        <p className="text-sm text-green-800 mt-1">
          Please confirm whether you have received your PC.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading !== null}
          className="flex-1 py-2.5 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white font-medium rounded-lg transition-colors text-sm"
        >
          {loading === "confirm" ? "Saving..." : "Yes, I received it"}
        </button>
        <button
          type="button"
          onClick={handleNotReceived}
          disabled={loading !== null}
          className="flex-1 py-2.5 border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50 font-medium rounded-lg transition-colors text-sm"
        >
          {loading === "not_received" ? "Saving..." : "No, I haven't received it"}
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}
