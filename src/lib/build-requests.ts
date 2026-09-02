import type { SupabaseClient } from "@supabase/supabase-js";

export async function ensureBuyerProfile(
  supabase: SupabaseClient,
  userId: string,
  email: string,
  fullName: string
): Promise<string | null> {
  const { data: existing, error: readError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (readError) {
    return readError.message;
  }

  if (existing) {
    return null;
  }

  const { error: insertError } = await supabase.from("profiles").insert({
    id: userId,
    email,
    full_name: fullName,
    role: "buyer",
  });

  if (insertError) {
    return insertError.message;
  }

  return null;
}
