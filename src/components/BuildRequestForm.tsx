"use client";

import { USE_CASES } from "@/lib/types";

export type BuildRequestFormValues = {
  useCase: string;
  budget: string;
  existingParts: string;
  preferences: string;
};

interface BuildRequestFormProps {
  values: BuildRequestFormValues;
  onChange: (values: BuildRequestFormValues) => void;
  submitLabel?: string;
  loading?: boolean;
  error?: string;
  onSubmit: (e: React.FormEvent) => void;
}

export default function BuildRequestForm({
  values,
  onChange,
  submitLabel = "Continue",
  loading = false,
  error,
  onSubmit,
}: BuildRequestFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium mb-1.5 text-neutral-700">
          What will you use this PC for?
        </label>
        <select
          value={values.useCase}
          onChange={(e) => onChange({ ...values, useCase: e.target.value })}
          required
          className="w-full bg-white border border-border rounded-lg px-3 py-2.5 text-sm"
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
          value={values.budget}
          onChange={(e) => onChange({ ...values, budget: e.target.value })}
          placeholder="e.g. 1500"
          required
          min="0"
          step="1"
          className="w-full bg-white border border-border rounded-lg px-3 py-2.5 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5 text-neutral-700">
          Parts you already own (if any)
        </label>
        <textarea
          value={values.existingParts}
          onChange={(e) => onChange({ ...values, existingParts: e.target.value })}
          placeholder="e.g. Monitor, SSD, old GPU, case..."
          rows={3}
          className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 text-sm resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5 text-neutral-700">
          Preferences & notes
        </label>
        <textarea
          value={values.preferences}
          onChange={(e) => onChange({ ...values, preferences: e.target.value })}
          placeholder="e.g. Quiet fans, no RGB, compact case, specific games..."
          rows={3}
          className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 text-sm resize-none"
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
      >
        {loading ? "Please wait..." : submitLabel}
      </button>
    </form>
  );
}

export function draftFromFormValues(values: BuildRequestFormValues) {
  return {
    use_case: values.useCase,
    budget: parseFloat(values.budget) || 0,
    existing_parts: values.existingParts,
    preferences: values.preferences,
  };
}

export function formValuesFromDraft(draft: {
  use_case: string;
  budget: number;
  existing_parts: string;
  preferences: string;
}): BuildRequestFormValues {
  return {
    useCase: draft.use_case,
    budget: draft.budget?.toString() ?? "",
    existingParts: draft.existing_parts ?? "",
    preferences: draft.preferences ?? "",
  };
}
