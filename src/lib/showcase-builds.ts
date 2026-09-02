import { createClient } from "@/lib/supabase/server";
import { toBuildShowcase } from "@/lib/types";
import type { BuildShowcase } from "@/lib/types";
import fallbackBuilds from "../../content/builds.json";

export async function getShowcaseBuilds(): Promise<BuildShowcase[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("showcase_builds")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (data && data.length > 0) {
    return data.map(toBuildShowcase);
  }

  return fallbackBuilds as BuildShowcase[];
}
