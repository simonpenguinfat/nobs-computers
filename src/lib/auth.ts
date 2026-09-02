import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRole } from "./types";

export async function getUserRole(
  supabase: SupabaseClient,
  authUser: User
): Promise<UserRole> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", authUser.id)
    .maybeSingle();

  if (error) {
    console.error("Failed to load profile role:", error.message);
  }

  if (profile?.role === "builder" || profile?.role === "buyer") {
    return profile.role;
  }

  // Profile missing — default new accounts to buyer
  const role: UserRole = "buyer";

  await supabase.from("profiles").upsert({
    id: authUser.id,
    email: authUser.email ?? "",
    full_name: authUser.user_metadata?.full_name ?? "",
    role,
  });

  return role;
}

export function dashboardPathForRole(role: UserRole): "/admin" | "/buyer" {
  return role === "builder" ? "/admin" : "/buyer";
}
