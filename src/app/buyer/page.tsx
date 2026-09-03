import { redirect } from "next/navigation";
import NavbarAuth from "@/components/NavbarAuth";
import BuyerDashboardClient from "@/components/BuyerDashboardClient";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/auth";
import type { BuildRequest } from "@/lib/types";
import { ACTIVE_STATUSES } from "@/lib/types";

export default async function BuyerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/buyer");

  const role = await getUserRole(supabase, user);
  if (role === "builder") redirect("/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: buildRequest } = await supabase
    .from("build_requests")
    .select("*")
    .eq("buyer_id", user.id)
    .in("status", [...ACTIVE_STATUSES])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: declinedRequest } = buildRequest
    ? { data: null }
    : await supabase
        .from("build_requests")
        .select("*")
        .eq("buyer_id", user.id)
        .eq("status", "rejected")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

  return (
    <>
      <NavbarAuth />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">My Build</h1>
          <p className="text-neutral-500 text-sm mt-1">
            Tell us what you need and track your custom PC build.
          </p>
        </div>
        <BuyerDashboardClient
          userId={user.id}
          userName={profile?.full_name ?? user.user_metadata?.full_name ?? "Guest"}
          userEmail={user.email ?? profile?.email ?? ""}
          memberSince={profile?.created_at ?? user.created_at}
          initialRequest={(buildRequest as BuildRequest) ?? null}
          initialDeclined={(declinedRequest as BuildRequest) ?? null}
        />
      </div>
    </>
  );
}
