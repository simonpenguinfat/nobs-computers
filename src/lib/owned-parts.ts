import catalog from "../../content/part-catalog.json";
import {
  NONE_PART,
  OWNABLE_PART_CATEGORIES,
  type PartCategory,
} from "@/lib/types";

export type OwnedPartsSelection = Record<string, string>;

export function partOptions(category: string): string[] {
  const list = (catalog as Record<string, string[]>)[category];
  return Array.isArray(list) ? list : [];
}

export function emptyOwnedParts(): OwnedPartsSelection {
  const selection: OwnedPartsSelection = {};
  for (const category of OWNABLE_PART_CATEGORIES) {
    selection[category] = NONE_PART;
  }
  return selection;
}

export function parseOwnedParts(raw: string): {
  selection: OwnedPartsSelection;
  legacy: string;
} {
  const selection = emptyOwnedParts();
  if (!raw.trim()) {
    return { selection, legacy: "" };
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const record = parsed as Record<string, unknown>;
      for (const category of OWNABLE_PART_CATEGORIES) {
        const value = record[category];
        if (typeof value === "string" && value.trim()) {
          selection[category] = value;
        }
      }
      return { selection, legacy: "" };
    }
  } catch {
    // Free-text from older requests
  }

  return { selection, legacy: raw };
}

export function serializeOwnedParts(selection: OwnedPartsSelection): string {
  const normalized = emptyOwnedParts();
  for (const category of OWNABLE_PART_CATEGORIES) {
    normalized[category] = selection[category]?.trim() || NONE_PART;
  }
  return JSON.stringify(normalized);
}

export function ownedPartsToDisplay(
  raw: string
): { category: string; name: string }[] {
  const { selection, legacy } = parseOwnedParts(raw);
  if (legacy) {
    return [{ category: "Notes", name: legacy }];
  }

  return OWNABLE_PART_CATEGORIES.map((category) => ({
    category,
    name: selection[category] || NONE_PART,
  }));
}

export function isOwnableCategory(category: string): category is PartCategory {
  return (OWNABLE_PART_CATEGORIES as readonly string[]).includes(category);
}
