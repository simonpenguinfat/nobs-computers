import { PART_CATEGORIES, type BuildQuote, type BuildQuotePart } from "@/lib/types";

export function newPartId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `part-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function emptyPart(category = "Other"): BuildQuotePart {
  return {
    id: newPartId(),
    category,
    name: "",
    price: null,
    url: "",
  };
}

export function defaultPartsList(): BuildQuotePart[] {
  return PART_CATEGORIES.filter((category) => category !== "Other").map((category) =>
    emptyPart(category)
  );
}

export function normalizeParts(raw: unknown): BuildQuotePart[] {
  if (!Array.isArray(raw)) return [];

  return raw.map((item, index) => {
    const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    const priceValue = row.price;
    const price =
      typeof priceValue === "number"
        ? priceValue
        : typeof priceValue === "string" && priceValue.trim() !== ""
          ? Number(priceValue)
          : null;

    return {
      id: typeof row.id === "string" && row.id ? row.id : `part-${index}-${newPartId()}`,
      category: typeof row.category === "string" && row.category ? row.category : "Other",
      name: typeof row.name === "string" ? row.name : "",
      price: price != null && !Number.isNaN(price) ? price : null,
      url: typeof row.url === "string" ? row.url : "",
    };
  });
}

export function normalizeQuote(row: Record<string, unknown>): BuildQuote {
  return {
    id: String(row.id),
    build_request_id: String(row.build_request_id),
    title: typeof row.title === "string" && row.title ? row.title : "Draft",
    notes: typeof row.notes === "string" ? row.notes : "",
    parts: normalizeParts(row.parts),
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

export function quoteTotal(parts: BuildQuotePart[]): number {
  return parts.reduce((sum, part) => sum + (part.price ?? 0), 0);
}

export function visibleParts(parts: BuildQuotePart[]): BuildQuotePart[] {
  return parts.filter((part) => part.name.trim() || part.price != null || part.url.trim());
}

export function formatCad(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return "—";
  return `$${amount.toLocaleString("en-CA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function safePartUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.href;
  } catch {
    return null;
  }
}
