export function formatAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("rate limit")) {
    return "Too many emails sent. Please wait about an hour and try again. If you keep seeing this, ask the site owner to set up custom email in Supabase.";
  }

  if (lower.includes("already registered") || lower.includes("already been registered")) {
    return "An account with this email already exists. Try logging in instead.";
  }

  if (lower.includes("email not confirmed")) {
    return "Please check your email and click the verification link before logging in.";
  }

  return message;
}
