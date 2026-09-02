export function formatBuildRequestError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("duplicate") || lower.includes("one_active_per_buyer")) {
    return "You already have an active build request.";
  }

  if (lower.includes("permission denied") || lower.includes("row-level security")) {
    return "Could not save your request. Please try again or contact us.";
  }

  return message;
}
