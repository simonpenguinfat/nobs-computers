export const BUILD_REQUEST_DRAFT_KEY = "nobs_build_request_draft";

export type BuildRequestDraft = {
  use_case: string;
  budget: number;
  existing_parts: string;
  preferences: string;
  use_case_detail?: string;
  priority?: string;
  resolution?: string;
  form_factor?: string;
  notes?: string;
};

export function saveBuildRequestDraft(draft: BuildRequestDraft): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(BUILD_REQUEST_DRAFT_KEY, JSON.stringify(draft));
}

export function loadBuildRequestDraft(): BuildRequestDraft | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(BUILD_REQUEST_DRAFT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BuildRequestDraft;
  } catch {
    return null;
  }
}

export function clearBuildRequestDraft(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(BUILD_REQUEST_DRAFT_KEY);
}
