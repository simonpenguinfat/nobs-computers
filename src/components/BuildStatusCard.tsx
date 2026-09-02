import { BUILD_STATUSES } from "@/lib/types";
import type { BuildRequest } from "@/lib/types";

interface BuildStatusCardProps {
  request: BuildRequest | null;
}

export default function BuildStatusCard({ request }: BuildStatusCardProps) {
  if (!request) {
    return (
      <div className="bg-surface-card border border-border rounded-xl p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-surface-light flex items-center justify-center mx-auto mb-3 border border-border">
          <span className="text-2xl">📋</span>
        </div>
        <h3 className="font-medium mb-1 text-neutral-900">No Active Build</h3>
        <p className="text-neutral-500 text-sm">
          Fill out the survey to get started with your custom PC.
        </p>
      </div>
    );
  }

  const statusInfo = BUILD_STATUSES[request.status];

  return (
    <div className="bg-surface-card border border-border rounded-xl p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-neutral-900">Your Build</h3>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-neutral-500 mb-0.5">Use Case</p>
          <p className="text-sm font-medium text-neutral-900">{request.use_case || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-500 mb-0.5">Budget</p>
          <p className="text-sm font-medium text-neutral-900">
            {request.budget ? `$${request.budget.toLocaleString()}` : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-neutral-500 mb-0.5">Estimated Cost</p>
          <p className="text-sm font-medium text-neutral-800">
            {request.estimated_cost
              ? `$${request.estimated_cost.toLocaleString()}`
              : "Pending quote"}
          </p>
        </div>
        <div>
          <p className="text-xs text-neutral-500 mb-0.5">Submitted</p>
          <p className="text-sm font-medium text-neutral-900">
            {new Date(request.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {request.existing_parts && (
        <div>
          <p className="text-xs text-neutral-500 mb-0.5">Your Existing Parts</p>
          <p className="text-sm text-neutral-700">{request.existing_parts}</p>
        </div>
      )}
    </div>
  );
}
