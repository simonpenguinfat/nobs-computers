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
  status: "pending" | "in_progress" | "completed" | "cancelled";
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

export const BUILD_STATUSES = {
  pending: { label: "Pending Review", color: "text-amber-700 bg-amber-50" },
  in_progress: { label: "In Progress", color: "text-neutral-700 bg-neutral-100" },
  completed: { label: "Completed", color: "text-green-700 bg-green-50" },
  cancelled: { label: "Cancelled", color: "text-red-700 bg-red-50" },
} as const;

export const USE_CASES = [
  "Gaming",
  "Content Creation",
  "Office / School",
  "Programming",
  "Streaming",
  "General Use",
  "Other",
];
