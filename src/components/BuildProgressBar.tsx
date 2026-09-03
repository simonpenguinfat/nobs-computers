"use client";

import {
  BUILD_PROGRESS_STAGES,
  buildStageIndex,
  resolveBuildStage,
  type BuildRequest,
} from "@/lib/types";

export default function BuildProgressBar({
  request,
}: {
  request: BuildRequest | null;
}) {
  const current = resolveBuildStage(request);
  const currentIdx = request ? buildStageIndex(current) : 0;

  return (
    <div className="w-full overflow-x-auto pb-1">
      <ol className="flex min-w-max items-start">
        {BUILD_PROGRESS_STAGES.map((stage, index) => {
          const isDone = Boolean(request) && index < currentIdx;
          const isCurrent = index === currentIdx;
          const connectorDone = Boolean(request) && index < currentIdx;

          return (
            <li key={stage.id} className="flex items-start">
              <div className="flex w-[4.6rem] sm:w-[5.4rem] flex-col items-center text-center px-0.5">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold ${
                    isDone
                      ? "border-green-600 bg-green-600 text-white"
                      : isCurrent
                        ? "border-brand-600 bg-brand-600 text-white"
                        : "border-neutral-300 bg-white text-neutral-400"
                  }`}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isDone ? "✓" : isCurrent ? "●" : "○"}
                </span>
                <span
                  className={`mt-1.5 text-[10px] sm:text-xs leading-tight font-medium ${
                    isDone || isCurrent ? "text-neutral-900" : "text-neutral-400"
                  }`}
                >
                  {stage.label}
                </span>
              </div>
              {index < BUILD_PROGRESS_STAGES.length - 1 ? (
                <div
                  className={`mt-3.5 h-0.5 w-2.5 sm:w-3.5 shrink-0 ${
                    connectorDone ? "bg-green-600" : "bg-neutral-200"
                  }`}
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
