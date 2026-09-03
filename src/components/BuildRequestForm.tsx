"use client";

import { useState } from "react";
import {
  BUILD_PRIORITIES,
  DISPLAY_TARGETS,
  FORM_FACTORS,
  USE_CASES,
} from "@/lib/types";
import ExistingPartsPicker from "@/components/ExistingPartsPicker";
import {
  parseOwnedParts,
  serializeOwnedParts,
} from "@/lib/owned-parts";
import type { BuildRequestDraft } from "@/lib/build-request-draft";

export type BuildRequestFormValues = {
  useCase: string;
  useCaseDetail: string;
  budget: string;
  priority: string;
  resolution: string;
  formFactor: string;
  existingParts: string;
  preferences: string;
};

export const EMPTY_FORM_VALUES: BuildRequestFormValues = {
  useCase: "",
  useCaseDetail: "",
  budget: "",
  priority: "",
  resolution: "",
  formFactor: "",
  existingParts: "",
  preferences: "",
};

const QUESTION_STEPS = 4;

interface BuildRequestFormProps {
  values: BuildRequestFormValues;
  onChange: (values: BuildRequestFormValues) => void;
  submitLabel?: string;
  loading?: boolean;
  error?: string;
  onSubmit: (e: React.FormEvent) => void;
}

function ChoiceGrid({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {options.map((option) => {
        const selected = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
              selected
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-border bg-white text-neutral-800 hover:border-neutral-400"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export default function BuildRequestForm({
  values,
  onChange,
  submitLabel = "Continue",
  loading = false,
  error,
  onSubmit,
}: BuildRequestFormProps) {
  const [qStep, setQStep] = useState(0);
  const [stepError, setStepError] = useState("");
  const owned = parseOwnedParts(values.existingParts);
  const showDisplayTarget =
    values.useCase === "Gaming" || values.useCase === "Streaming";

  function validateStep(step: number): string {
    if (step === 0 && !values.useCase) {
      return "Choose what you’ll mainly use the PC for.";
    }
    if (step === 1) {
      if (!values.budget || Number(values.budget) <= 0) {
        return "Enter a budget greater than 0.";
      }
      if (!values.priority) {
        return "Pick what matters most for this build.";
      }
      if (showDisplayTarget && !values.resolution) {
        return "Choose a display target (or Not sure).";
      }
    }
    return "";
  }

  function goNext() {
    const message = validateStep(qStep);
    if (message) {
      setStepError(message);
      return;
    }
    setStepError("");
    setQStep((s) => Math.min(s + 1, QUESTION_STEPS - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setStepError("");
    setQStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (qStep < QUESTION_STEPS - 1) {
      goNext();
      return;
    }
    const message = validateStep(qStep);
    if (message) {
      setStepError(message);
      return;
    }
    setStepError("");
    onSubmit(e);
  }

  const titles = [
    "What will you use it for?",
    "Budget & priorities",
    "Parts you already own",
    "Final preferences",
  ];
  const blurb = [
    "This helps us match the right CPU, GPU, and overall build style.",
    "A clear budget and priority keep recommendations honest — no pad-the-quote upgrades.",
    "We’ll reuse what makes sense and skip what doesn’t.",
    "Anything we should know before we suggest a build?",
  ];

  return (
    <form onSubmit={handleFormSubmit} className="space-y-5">
      <div>
        <div className="flex items-center justify-between gap-3 mb-2">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-600">
            Question {qStep + 1} of {QUESTION_STEPS}
          </p>
          <div className="flex gap-1.5">
            {Array.from({ length: QUESTION_STEPS }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-6 rounded-full ${
                  i <= qStep ? "bg-brand-600" : "bg-neutral-200"
                }`}
              />
            ))}
          </div>
        </div>
        <h2 className="text-xl font-bold text-neutral-950">{titles[qStep]}</h2>
        <p className="text-sm text-neutral-600 mt-1">{blurb[qStep]}</p>
      </div>

      {qStep === 0 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-neutral-700">
              Main use
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
              What will you run on it?
            </label>
            <textarea
              value={values.useCaseDetail}
              onChange={(e) =>
                onChange({ ...values, useCaseDetail: e.target.value })
              }
              placeholder={
                values.useCase === "Gaming"
                  ? "e.g. Fortnite, Cyberpunk, competitive FPS…"
                  : "e.g. Premiere, Excel, VS Code, Twitch…"
              }
              rows={3}
              className="w-full bg-white border border-border rounded-lg px-3 py-2.5 text-sm resize-none"
            />
            <p className="text-xs text-neutral-500 mt-1.5">Optional, but helpful.</p>
          </div>
        </div>
      )}

      {qStep === 1 && (
        <div className="space-y-5">
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
            <label className="block text-sm font-medium mb-2 text-neutral-700">
              What matters most?
            </label>
            <ChoiceGrid
              options={BUILD_PRIORITIES}
              value={values.priority}
              onChange={(priority) => onChange({ ...values, priority })}
            />
          </div>
          {showDisplayTarget && (
            <div>
              <label className="block text-sm font-medium mb-2 text-neutral-700">
                Target display
              </label>
              <ChoiceGrid
                options={DISPLAY_TARGETS}
                value={values.resolution}
                onChange={(resolution) => onChange({ ...values, resolution })}
              />
            </div>
          )}
        </div>
      )}

      {qStep === 2 && (
        <div className="space-y-3">
          <ExistingPartsPicker
            value={owned.selection}
            onChange={(selection) =>
              onChange({
                ...values,
                existingParts: serializeOwnedParts(selection),
              })
            }
          />
          {owned.legacy ? (
            <p className="text-xs text-neutral-500">
              Previously entered: {owned.legacy}
            </p>
          ) : null}
          <p className="text-xs text-neutral-500">
            Skip any category you don&apos;t have — leave it as None.
          </p>
        </div>
      )}

      {qStep === 3 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2 text-neutral-700">
              Case size preference
            </label>
            <ChoiceGrid
              options={FORM_FACTORS}
              value={values.formFactor}
              onChange={(formFactor) => onChange({ ...values, formFactor })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-neutral-700">
              Anything else?
            </label>
            <textarea
              value={values.preferences}
              onChange={(e) =>
                onChange({ ...values, preferences: e.target.value })
              }
              placeholder="Quiet fans, no RGB, must fit under a desk, Wi-Fi needed, deal-breakers…"
              rows={3}
              className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 text-sm resize-none"
            />
          </div>
        </div>
      )}

      {(stepError || error) && (
        <p className="text-red-600 text-sm">{stepError || error}</p>
      )}

      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
        {qStep > 0 ? (
          <button
            type="button"
            onClick={goBack}
            className="sm:w-1/3 py-3 border border-border text-neutral-700 hover:bg-neutral-50 font-medium rounded-xl transition-colors"
          >
            Back
          </button>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
        >
          {loading
            ? "Please wait..."
            : qStep < QUESTION_STEPS - 1
              ? "Next"
              : submitLabel}
        </button>
      </div>
    </form>
  );
}

export function draftFromFormValues(
  values: BuildRequestFormValues
): BuildRequestDraft {
  const preferenceLines = [
    values.useCaseDetail.trim() && `Games / apps: ${values.useCaseDetail.trim()}`,
    values.priority && `Priority: ${values.priority}`,
    values.resolution && `Display: ${values.resolution}`,
    values.formFactor && `Case size: ${values.formFactor}`,
    values.preferences.trim() && `Notes: ${values.preferences.trim()}`,
  ].filter(Boolean);

  return {
    use_case: values.useCase,
    budget: parseFloat(values.budget) || 0,
    existing_parts: values.existingParts,
    preferences: preferenceLines.join("\n"),
    use_case_detail: values.useCaseDetail,
    priority: values.priority,
    resolution: values.resolution,
    form_factor: values.formFactor,
    notes: values.preferences,
  };
}

export function formValuesFromDraft(
  draft: BuildRequestDraft
): BuildRequestFormValues {
  return {
    useCase: draft.use_case ?? "",
    useCaseDetail: draft.use_case_detail ?? "",
    budget: draft.budget != null ? String(draft.budget) : "",
    priority: draft.priority ?? "",
    resolution: draft.resolution ?? "",
    formFactor: draft.form_factor ?? "",
    existingParts: draft.existing_parts ?? "",
    preferences: draft.notes ?? "",
  };
}
