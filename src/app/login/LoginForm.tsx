"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getUserRole } from "@/lib/auth";
import NavbarAuth from "@/components/NavbarAuth";
import SetupNotice from "@/components/SetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export default function LoginForm() {
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
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const role = await getUserRole(supabase, data.user);

      if (role === "builder") {
        await supabase.auth.signOut();
        setError("Please use the Admin portal below to sign in.");
        setLoading(false);
        return;
      }

      router.push("/buyer");
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <>
      <NavbarAuth />
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-md">
          <div className="bg-surface-card border border-border rounded-xl p-6 sm:p-8 shadow-sm">
            <h1 className="text-2xl font-bold mb-1 text-neutral-900">Log in</h1>
            <p className="text-neutral-500 text-sm mb-6">
              Sign in to your account
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
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-neutral-900 font-medium hover:underline">
                Sign up
              </Link>
            </p>

            <div className="mt-6 pt-6 border-t border-border">
              <Link
                href="/admin/login"
                className="block w-full text-center py-2.5 border border-border rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Admin portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
