import { BUILD_STATUSES, isArchivedStatus } from "@/lib/types";
import type { BuildRequest } from "@/lib/types";
import DeliveryConfirmation from "@/components/DeliveryConfirmation";
import BuyerOrderActions from "@/components/BuyerOrderActions";
import OwnedPartsSummary from "@/components/OwnedPartsSummary";

interface BuildStatusCardProps {
  request: BuildRequest | null;
  onRequestUpdated?: (request: BuildRequest | null) => void;
}

export default function BuildStatusCard({ request, onRequestUpdated }: BuildStatusCardProps) {
  if (!request || isArchivedStatus(request.status)) {
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
        <div className="col-span-2">
          <p className="text-xs text-neutral-500 mb-0.5">Submitted</p>
          <p className="text-sm font-medium text-neutral-900">
            {new Date(request.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {request.existing_parts && (
        <OwnedPartsSummary raw={request.existing_parts} heading="Your existing parts" />
      )}

      {request.status === "not_received" && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800 font-medium">Delivery issue reported</p>
          <p className="text-sm text-red-700 mt-1">
            We&apos;ve been notified and will follow up with you shortly.
          </p>
        </div>
      )}

      {onRequestUpdated && (
        <>
          <BuyerOrderActions request={request} onUpdated={onRequestUpdated} />
          <DeliveryConfirmation request={request} onUpdated={onRequestUpdated} />
        </>
      )}
    </div>
  );
}
