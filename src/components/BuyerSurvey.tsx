"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { USE_CASES } from "@/lib/types";
import type { BuildRequest } from "@/lib/types";
import ExistingPartsPicker from "@/components/ExistingPartsPicker";
import {
  parseOwnedParts,
  serializeOwnedParts,
} from "@/lib/owned-parts";

interface BuyerSurveyProps {
  userId: string;
  existingRequest: BuildRequest | null;
  onSubmitted: (request: BuildRequest) => void;
}

export default function BuyerSurvey({
  userId,
  existingRequest,
  onSubmitted,
}: BuyerSurveyProps) {
  const parsedParts = parseOwnedParts(existingRequest?.existing_parts ?? "");
  const [useCase, setUseCase] = useState(existingRequest?.use_case ?? "");
  const [budget, setBudget] = useState(existingRequest?.budget?.toString() ?? "");
  const [ownedParts, setOwnedParts] = useState(parsedParts.selection);
  const [legacyParts] = useState(parsedParts.legacy);
  const [preferences, setPreferences] = useState(
    existingRequest?.preferences ?? ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const canEdit =
    !existingRequest ||
    existingRequest.status === "pending" ||
    existingRequest.status === "in_progress";

  if (existingRequest && !canEdit) {
    return (
      <p className="text-sm text-neutral-500">
        This build is no longer editable. Contact us in chat if you need changes.
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSaved(false);

    const payload = {
      use_case: useCase,
      budget: parseFloat(budget) || 0,
      existing_parts: serializeOwnedParts(ownedParts),
      preferences,
      updated_at: new Date().toISOString(),
    };

    if (existingRequest) {
      const { data, error: updateError } = await supabase
        .from("build_requests")
        .update(payload)
        .eq("id", existingRequest.id)
        .select()
        .single();

      if (updateError) {
        setError(updateError.message);
      } else if (data) {
        setSaved(true);
        onSubmitted(data);
      }
    } else {
      const { data, error: insertError } = await supabase
        .from("build_requests")
        .insert({ ...payload, buyer_id: userId, status: "pending", build_stage: "review" })
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
      } else if (data) {
        setSaved(true);
        onSubmitted(data);
      }
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {existingRequest && (
        <p className="text-sm text-neutral-500">
          You can update your use case, budget, parts, and notes. Your chat,
          suggested builds, and order status stay as they are. Your builder will
          be notified.
        </p>
      )}

      <div>
        <label className="block text-sm font-medium mb-1.5 text-neutral-700">
          What will you use this PC for?
        </label>
        <select
          value={useCase}
          onChange={(e) => setUseCase(e.target.value)}
          required
          className="w-full bg-white border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-neutral-400"
        >
          <option value="">Select a use case...</option>
          {USE_CASES.map((uc) => (
            <option key={uc} value={uc}>
              {uc}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5 text-neutral-700">
          Budget (CAD)
        </label>
        <input
          type="number"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          placeholder="e.g. 1500"
          required
          min="0"
          className="w-full bg-white border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-neutral-400"
        />
      </div>

      <ExistingPartsPicker value={ownedParts} onChange={setOwnedParts} />
      {legacyParts ? (
        <p className="text-xs text-neutral-500 -mt-2">
          Previously entered: {legacyParts}
        </p>
      ) : null}

      <div>
        <label className="block text-sm font-medium mb-1.5 text-neutral-700">
          Preferences & notes
        </label>
        <textarea
          value={preferences}
          onChange={(e) => setPreferences(e.target.value)}
          placeholder="e.g. Quiet fans, RGB lighting, compact case, specific games..."
          rows={3}
          className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500 resize-none"
        />
      </div>

      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}
      {saved && (
        <p className="text-green-700 text-sm">
          {existingRequest
            ? "Request updated. Your builder has been notified."
            : "Request submitted."}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
      >
        {loading
          ? "Saving..."
          : existingRequest
            ? "Update request"
            : "Submit Request"}
      </button>
    </form>
  );
}
