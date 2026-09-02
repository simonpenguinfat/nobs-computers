"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import NavbarAuth from "@/components/NavbarAuth";
import SetupNotice from "@/components/SetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { formatAuthError } from "@/lib/auth-errors";
import {
  clearBuildRequestDraft,
  loadBuildRequestDraft,
} from "@/lib/build-request-draft";
import { ensureBuyerProfile } from "@/lib/build-requests";

export default function SignupForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setConfirmationSent(false);

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
      setConfirmationSent(true);
      setLoading(false);
      return;
    }

    if (data.session) {
      const draft = loadBuildRequestDraft();
      if (draft && data.user) {
        await ensureBuyerProfile(supabase, data.user.id, email, fullName);
        const payload = {
          use_case: draft.use_case,
          budget: draft.budget,
          existing_parts: draft.existing_parts,
          preferences: draft.preferences,
          updated_at: new Date().toISOString(),
        };
        const { error: insertError } = await supabase.from("build_requests").insert({
          ...payload,
          buyer_id: data.user.id,
          status: "pending",
        });
        if (!insertError) {
          clearBuildRequestDraft();
        }
      }
      router.push("/buyer");
      router.refresh();
    }

    setLoading(false);
  }

  if (confirmationSent) {
    return (
      <>
        <NavbarAuth />
        <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 sm:px-6 py-8">
          <div className="w-full max-w-md">
            <div className="bg-surface-card border border-border rounded-xl p-6 sm:p-8 shadow-sm text-center">
              <h1 className="text-2xl font-bold mb-2 text-neutral-900">Check your email</h1>
              <p className="text-neutral-500 text-sm mb-6">
                We sent a verification link to <strong className="text-neutral-700">{email}</strong>.
                Click the link to activate your account, then log in.
              </p>
              <Link
                href="/login"
                className="inline-block px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-medium rounded-lg transition-colors"
              >
                Go to login
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NavbarAuth />
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-md">
          <div className="bg-surface-card border border-border rounded-xl p-6 sm:p-8 shadow-sm">
            <h1 className="text-2xl font-bold mb-1 text-neutral-900">Create an account</h1>
            <p className="text-neutral-500 text-sm mb-6">
              Already submitted a build? Create a password to track it. New here?{" "}
              <Link href="/build" className="text-brand-600 font-semibold hover:text-brand-500">
                Start with the questionnaire
              </Link>
              .
            </p>

            {!isSupabaseConfigured() && <SetupNotice />}

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-neutral-700">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full bg-white border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-neutral-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-neutral-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-white border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-neutral-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-neutral-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-white border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-neutral-400"
                />
              </div>

              {error && <p className="text-red-600 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
              >
                {loading ? "Creating account..." : "Sign up"}
              </button>
            </form>

            <p className="text-center text-sm text-neutral-500 mt-6">
              Already have an account?{" "}
              <Link href="/login" className="text-neutral-900 font-medium hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
