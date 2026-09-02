function normalizeOrigin(url: string): string {
  return url.replace(/\/$/, "");
}

export function getSiteOrigin(request: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) {
    return normalizeOrigin(envUrl);
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";

  if (forwardedHost) {
    const host = forwardedHost.split(",")[0].trim();
    return `${forwardedProto}://${host}`;
  }

  const host = request.headers.get("host");
  if (host && !host.startsWith("localhost") && !host.startsWith("127.0.0.1")) {
    const proto =
      request.headers.get("x-forwarded-proto") ??
      (host.includes("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }

  return new URL(request.url).origin;
}
