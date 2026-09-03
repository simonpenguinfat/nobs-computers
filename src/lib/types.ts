export type UserRole = "buyer" | "builder";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface BuildRequest {
  id: string;
  buyer_id: string;
  use_case: string;
  budget: number;
  existing_parts: string;
  preferences: string;
  status: "pending" | "in_progress" | "completed" | "cancelled" | "confirmed" | "not_received" | "rejected";
  estimated_cost: number | null;
  created_at: string;
  updated_at: string;
}

export const PART_CATEGORIES = [
  "CPU",
  "GPU",
  "RAM",
  "SSD",
  "PSU",
  "Motherboard",
  "Case",
  "Fans",
  "CPU Cooling",
  "Other",
] as const;

export type PartCategory = (typeof PART_CATEGORIES)[number];

export const OWNABLE_PART_CATEGORIES = PART_CATEGORIES.filter(
  (category) => category !== "Other"
);

export const PART_CATEGORY_SHORT: Record<string, string> = {
  CPU: "CPU",
  GPU: "GPU",
  RAM: "RAM",
  SSD: "SSD",
  PSU: "PSU",
  Motherboard: "Mobo",
  Case: "Case",
  Fans: "Fans",
  "CPU Cooling": "Cooler",
  Other: "Other",
};

export function partCategoryLabel(category: string): string {
  return PART_CATEGORY_SHORT[category] ?? category;
}

export const NONE_PART = "None";

export interface BuildQuotePart {
  id: string;
  category: string;
  name: string;
  price: number | null;
  url: string;
}

export interface BuildQuote {
  id: string;
  build_request_id: string;
  title: string;
  notes: string;
  parts: BuildQuotePart[];
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  build_request_id: string;
  sender_id: string;
  content: string;
  reply_to_id?: string | null;
  created_at: string;
  sender_name?: string;
  reply_to?: {
    id: string;
    content: string;
    sender_name?: string;
  } | null;
}

export interface BuildShowcase {
  id: string;
  title: string;
  description: string;
  details: string;
  image: string;
  specs: string[];
  price: string;
  useCase: string;
  builtDate: string | null;
}

export interface ShowcaseBuildRow {
  id: string;
  title: string;
  description: string;
  details: string;
  image_url: string;
  specs: string[];
  price: string;
  budget?: string;
  use_case: string;
  built_date: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export function formatBuiltDate(date: string | null): string {
  if (!date) return "";
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
  });
}

export function toBuildShowcase(row: ShowcaseBuildRow): BuildShowcase {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    details: row.details || row.description,
    image: row.image_url,
    specs: row.specs ?? [],
    price: row.price || row.budget || "",
    useCase: row.use_case,
    builtDate: row.built_date,
  };
}

export const BUILD_STATUSES = {
  pending: { label: "Awaiting Review", color: "text-amber-700 bg-amber-50" },
  in_progress: { label: "In Progress", color: "text-neutral-700 bg-neutral-100" },
  completed: { label: "Awaiting Customer", color: "text-green-700 bg-green-50" },
  not_received: { label: "Not Received", color: "text-red-700 bg-red-50" },
  cancelled: { label: "Cancelled", color: "text-red-700 bg-red-50" },
  rejected: { label: "Declined", color: "text-red-700 bg-red-50" },
  confirmed: { label: "Confirmed", color: "text-neutral-500 bg-neutral-100" },
} as const;

export const ACTIVE_STATUSES = [
  "pending",
  "in_progress",
  "completed",
  "not_received",
] as const;

export const ARCHIVED_STATUSES = [
  "confirmed",
  "cancelled",
  "rejected",
] as const;

export function isArchivedStatus(status: BuildRequest["status"]): boolean {
  return (ARCHIVED_STATUSES as readonly string[]).includes(status);
}

export const USE_CASES = [
  "Gaming",
  "Content Creation",
  "Office / School",
  "Programming",
  "Streaming",
  "General Use",
  "Other",
];
