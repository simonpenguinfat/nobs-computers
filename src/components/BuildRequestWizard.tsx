"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BuildRequestForm, {
  draftFromFormValues,
  EMPTY_FORM_VALUES,
  formValuesFromDraft,
  type BuildRequestFormValues,
} from "@/components/BuildRequestForm";
import {
  clearBuildRequestDraft,
  loadBuildRequestDraft,
  saveBuildRequestDraft,
} from "@/lib/build-request-draft";
import { formatAuthError } from "@/lib/auth-errors";
import { formatBuildRequestError } from "@/lib/build-request-errors";
import { ensureBuyerProfile } from "@/lib/build-requests";

type Step = "questionnaire" | "account" | "verify";

async function submitBuildRequest(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  draft: ReturnType<typeof draftFromFormValues>
) {
  const payload = {
    use_case: draft.use_case,
    budget: draft.budget,
    existing_parts: draft.existing_parts,
    preferences: draft.preferences,
    updated_at: new Date().toISOString(),
  };

  const existing = await supabase
    .from("build_requests")
    .select("id, status")
    .eq("buyer_id", userId)
    .in("status", ["pending", "in_progress", "completed", "not_received"])
    .maybeSingle();

  if (existing.data) {
    const { error } = await supabase
      .from("build_requests")
      .update(payload)
      .eq("id", existing.data.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("build_requests").insert({
      ...payload,
      buyer_id: userId,
      status: "pending",
      build_stage: "review",
    });
    if (error) return { error: formatBuildRequestError(error.message) };
  }

  clearBuildRequestDraft();
  return { error: null };
}

export default function BuildRequestWizard() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const initialDraft = loadBuildRequestDraft();
  const [step, setStep] = useState<Step>(initialDraft ? "account" : "questionnaire");
  const [formValues, setFormValues] = useState<BuildRequestFormValues>(
    initialDraft ? formValuesFromDraft(initialDraft) : EMPTY_FORM_VALUES
  );
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleQuestionnaireSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    saveBuildRequestDraft(draftFromFormValues(formValues));
    setStep("account");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleAccountSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const draft = draftFromFormValues(formValues);
    saveBuildRequestDraft(draft);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const redirectUrl = `${siteUrl}/auth/callback?next=/buyer`;

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: redirectUrl,
      },
    });

    if (authError) {
      setError(formatAuthError(authError.message));
      setLoading(false);
      return;
    }

    if (data.user && !data.session) {
      setStep("verify");
      setLoading(false);
      return;
    }

    if (data.session && data.user) {
      await ensureBuyerProfile(supabase, data.user.id, email, fullName);

      const result = await submitBuildRequest(supabase, data.user.id, draft);
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      router.push("/buyer");
      router.refresh();
    }

    setLoading(false);
  }

  const summaryBits = [
    formValues.useCase || null,
    formValues.budget ? `$${formValues.budget} CAD` : null,
    formValues.priority || null,
    formValues.resolution || null,
  ].filter(Boolean);

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-2 mb-8">
        <div
          className={`flex-1 h-1 rounded-full ${
            step === "questionnaire" ? "bg-brand-600" : "bg-brand-200"
          }`}
        />
        <div
          className={`flex-1 h-1 rounded-full ${
            step === "account" || step === "verify"
              ? "bg-brand-600"
              : "bg-neutral-200"
          }`}
        />
      </div>

      {step === "questionnaire" && (
        <div className="bg-white border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-950 mb-2">
            Find your best-fit PC
          </h1>
          <p className="text-neutral-600 text-sm sm:text-base mb-6">
            A few short steps — no account needed yet. We&apos;ll ask for a password
            at the end so you can track your build and chat with us.
          </p>
          <BuildRequestForm
            values={formValues}
            onChange={setFormValues}
            onSubmit={handleQuestionnaireSubmit}
            submitLabel="Continue to track your build"
          />
          <p className="text-center text-sm text-neutral-500 mt-6">
            Already have an account?{" "}
            <Link
              href="/login?redirect=/buyer"
              className="text-brand-600 font-semibold hover:text-brand-500"
            >
              Log in
            </Link>
          </p>
        </div>
      )}

      {step === "account" && (
        <div className="bg-white border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
          <button
            type="button"
            onClick={() => setStep("questionnaire")}
            className="text-sm text-neutral-500 hover:text-neutral-800 mb-4"
          >
            ← Edit your answers
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-950 mb-2">
            Create a password to track your build
          </h1>
          <p className="text-neutral-600 text-sm sm:text-base mb-6">
            Your answers are saved. Set up a free account so you can follow progress,
            chat with us, and get updates.
          </p>

          <div className="mb-6 p-4 bg-brand-50 border border-brand-100 rounded-xl text-sm text-neutral-700 space-y-1">
            <p className="font-medium text-neutral-900">Your request summary</p>
            <p>{summaryBits.join(" · ") || "—"}</p>
            {formValues.useCaseDetail.trim() ? (
              <p className="text-neutral-600">{formValues.useCaseDetail.trim()}</p>
            ) : null}
            {formValues.formFactor ? (
              <p className="text-neutral-600">Case: {formValues.formFactor}</p>
            ) : null}
          </div>

          <form onSubmit={handleAccountSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-neutral-700">
                Your name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full bg-white border border-border rounded-lg px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-neutral-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white border border-border rounded-lg px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-neutral-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-white border border-border rounded-lg px-3 py-2.5 text-sm"
              />
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
            >
              {loading ? "Submitting..." : "Submit build request"}
            </button>
          </form>
        </div>
      )}

      {step === "verify" && (
        <div className="bg-white border border-border rounded-2xl p-6 sm:p-8 shadow-sm text-center">
          <h1 className="text-2xl font-bold mb-2 text-neutral-950">Check your email</h1>
          <p className="text-neutral-600 text-sm mb-6">
            We sent a verification link to{" "}
            <strong className="text-neutral-900">{email}</strong>. Click it to
            activate your account — your build request will be submitted when you log in.
          </p>
          <Link
            href="/login?redirect=/buyer"
            className="inline-block px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition-colors"
          >
            Go to login
          </Link>
        </div>
      )}
    </div>
  );
}
