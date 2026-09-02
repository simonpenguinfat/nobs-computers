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

export interface Message {
  id: string;
  build_request_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
}

export interface BuildShowcase {
  id: string;
  title: string;
  description: string;
  image: string;
  specs: string[];
  budget: string;
  useCase: string;
}

export interface ShowcaseBuildRow {
  id: string;
  title: string;
  description: string;
  image_url: string;
  specs: string[];
  budget: string;
  use_case: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export function toBuildShowcase(row: ShowcaseBuildRow): BuildShowcase {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    image: row.image_url,
    specs: row.specs ?? [],
    budget: row.budget,
    useCase: row.use_case,
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
