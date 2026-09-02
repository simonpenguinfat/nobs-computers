import { createClient } from "@/lib/supabase/server";
import { toBuildShowcase } from "@/lib/types";
import type { BuildShowcase } from "@/lib/types";
import fallbackBuilds from "../../content/builds.json";

function normalizeFallback(build: Record<string, unknown>): BuildShowcase {
  return {
    id: String(build.id),
    title: String(build.title ?? ""),
    description: String(build.description ?? ""),
    details: String(build.details ?? build.description ?? ""),
    image: String(build.image ?? ""),
    specs: Array.isArray(build.specs) ? (build.specs as string[]) : [],
    price: String(build.price ?? build.budget ?? ""),
    useCase: String(build.useCase ?? ""),
    builtDate: build.builtDate ? String(build.builtDate) : null,
  };
}

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

  return (fallbackBuilds as Record<string, unknown>[]).map(normalizeFallback);
}

export async function getShowcaseBuildById(
  id: string
): Promise<BuildShowcase | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("showcase_builds")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (data) {
    return toBuildShowcase(data);
  }

  const fallback = (fallbackBuilds as Record<string, unknown>[]).find(
    (b) => String(b.id) === id
  );

  return fallback ? normalizeFallback(fallback) : null;
}
