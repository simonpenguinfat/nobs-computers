"use client";

import {
  BUILD_PROGRESS_STAGES,
  buildStageIndex,
  resolveBuildStage,
  type BuildProgressStage,
  type BuildRequest,
} from "@/lib/types";

interface BuildProgressBarProps {
  request: BuildRequest | null;
  /** Override displayed stage (e.g. admin draft before save). */
  stage?: BuildProgressStage | null;
  interactive?: boolean;
  disabled?: boolean;
  onSelect?: (stage: BuildProgressStage) => void;
}

export default function BuildProgressBar({
  request,
  stage,
  interactive = false,
  disabled = false,
  onSelect,
}: BuildProgressBarProps) {
  const current = stage ?? resolveBuildStage(request);
  const currentIdx = request || stage ? buildStageIndex(current) : 0;
  const canInteract = interactive && !disabled && Boolean(onSelect);

  return (
    <div className="w-full overflow-x-auto pb-1">
      <ol className="flex min-w-max items-start">
        {BUILD_PROGRESS_STAGES.map((item, index) => {
          const isDone = (Boolean(request) || Boolean(stage)) && index < currentIdx;
          const isCurrent = index === currentIdx;
          const connectorDone =
            (Boolean(request) || Boolean(stage)) && index < currentIdx;

          const content = (
            <>
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
                {item.label}
              </span>
            </>
          );

          return (
            <li key={item.id} className="flex items-start">
              {canInteract ? (
                <button
                  type="button"
                  onClick={() => onSelect?.(item.id)}
                  className="flex w-[4.6rem] sm:w-[5.4rem] flex-col items-center text-center px-0.5 rounded-lg hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  {content}
                </button>
              ) : (
                <div className="flex w-[4.6rem] sm:w-[5.4rem] flex-col items-center text-center px-0.5">
                  {content}
                </div>
              )}
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
