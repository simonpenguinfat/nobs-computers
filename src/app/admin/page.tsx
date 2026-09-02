import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import BrandLogo from "@/components/BrandLogo";
import AdminTabs from "@/components/AdminTabs";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/auth";
import type { BuildRequest, Profile } from "@/lib/types";
import { ACTIVE_STATUSES } from "@/lib/types";
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
    .in("status", [...ACTIVE_STATUSES])
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-border bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="min-w-0 flex items-center gap-3">
          <BrandLogo href="/" imageClassName="w-40 sm:w-52 h-auto max-h-12 hidden sm:block" />
            <div>
              <p className="font-semibold text-neutral-950 truncate sm:hidden">{site.siteName}</p>
              <p className="text-xs text-brand-600 font-semibold tracking-[0.2em] uppercase">
                Admin portal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/"
              className="text-sm text-neutral-700 hover:text-brand-600 px-2 py-2 font-medium"
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
        <AdminTabs
          clients={(clients ?? []) as (BuildRequest & { profiles: Profile })[]}
          builderId={user.id}
          builderName={profile?.full_name ?? "Admin"}
        />
      </div>
    </div>
  );
}
