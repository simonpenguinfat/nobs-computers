const ALLOWED_REDIRECTS = ["/buyer", "/admin", "/login", "/signup"] as const;

export function getSafeRedirectPath(
  next: string | null,
  fallback: "/buyer" | "/admin" = "/buyer"
): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("@")) {
    return fallback;
  }

  const path = next.split("?")[0];
  if (!ALLOWED_REDIRECTS.some((allowed) => path === allowed || path.startsWith(`${allowed}/`))) {
    return fallback;
  }

  return next;
}
