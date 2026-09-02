import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import BuilderDashboard from "@/components/BuilderDashboard";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/auth";
import type { BuildRequest, Profile } from "@/lib/types";
import site from "../../../content/site.json";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const role = await getUserRole(supabase, user);
  if (role !== "builder") redirect("/buyer");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: clients } = await supabase
    .from("build_requests")
    .select("*, profiles!buyer_id(*)")
    .neq("status", "confirmed")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-border bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-neutral-900 truncate">{site.siteName}</p>
            <p className="text-xs text-neutral-500">Admin portal</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/"
              className="text-sm text-neutral-600 hover:text-neutral-900 px-2 py-2"
            >
              Website
            </Link>
            <LogoutButton className="text-sm px-3 py-2 rounded-lg border border-border hover:bg-neutral-50 text-neutral-700" />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Dashboard</h1>
          <p className="text-neutral-500 text-sm mt-1">
            Manage clients, builds, and conversations
          </p>
        </div>
        <BuilderDashboard
          clients={(clients ?? []) as (BuildRequest & { profiles: Profile })[]}
          builderId={user.id}
          builderName={profile?.full_name ?? "Admin"}
        />
      </div>
    </div>
  );
}
