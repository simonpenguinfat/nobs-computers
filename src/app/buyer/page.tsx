import { redirect } from "next/navigation";
import NavbarAuth from "@/components/NavbarAuth";
import BuyerDashboardClient from "@/components/BuyerDashboardClient";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/auth";
import type { BuildRequest } from "@/lib/types";
import { ACTIVE_STATUSES, needsBuyerOutcomeAck } from "@/lib/types";

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

  const { data: closedRows } = await supabase
    .from("build_requests")
    .select("*")
    .eq("buyer_id", user.id)
    .in("status", ["rejected", "cancelled"])
    .order("updated_at", { ascending: false })
    .limit(5);

  const initialOutcome =
    ((closedRows as BuildRequest[] | null) ?? []).find((row) =>
      needsBuyerOutcomeAck(row)
    ) ?? null;

  return (
    <>
      <NavbarAuth />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <BuyerDashboardClient
          userId={user.id}
          userName={profile?.full_name ?? user.user_metadata?.full_name ?? "Guest"}
          userEmail={user.email ?? profile?.email ?? ""}
          memberSince={profile?.created_at ?? user.created_at}
          initialRequest={(buildRequest as BuildRequest) ?? null}
          initialOutcome={initialOutcome}
        />
      </div>
    </>
  );
}
