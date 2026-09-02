"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getUserRole } from "@/lib/auth";
import { formatAuthError } from "@/lib/auth-errors";
import SetupNotice from "@/components/SetupNotice";
import BrandLogo from "@/components/BrandLogo";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export default function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(formatAuthError(authError.message));
      setLoading(false);
      return;
    }

    if (data.user) {
      const role = await getUserRole(supabase, data.user);

      if (role !== "builder") {
        await supabase.auth.signOut();
        setError("Access denied. Please use the main login page.");
        setLoading(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="border-b border-border bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <BrandLogo href="/" imageClassName="w-44 sm:w-56 h-auto max-h-14" />
          <span className="text-xs text-brand-600 font-semibold uppercase tracking-[0.2em]">
            Admin
          </span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white border border-border rounded-xl p-6 sm:p-8 shadow-sm">
            <h1 className="text-2xl font-bold mb-1 text-neutral-900">Log in</h1>
            <p className="text-neutral-500 text-sm mb-6">
              Admin access only
            </p>

            {!isSupabaseConfigured() && <SetupNotice />}

            <form onSubmit={handleLogin} className="space-y-4">
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
                  className="w-full bg-white border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-neutral-400"
                />
              </div>

              {error && <p className="text-red-600 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
              >
                {loading ? "Logging in..." : "Log in"}
              </button>
            </form>

            <p className="text-center text-sm text-neutral-500 mt-6">
              <Link href="/login" className="text-neutral-700 hover:underline">
                ← Main login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
