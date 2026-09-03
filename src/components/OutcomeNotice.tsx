"use client";

interface OutcomeNoticeProps {
  title: string;
  reason?: string | null;
  confirming?: boolean;
  onConfirm: () => void;
}

export default function OutcomeNotice({
  title,
  reason,
  confirming,
  onConfirm,
}: OutcomeNoticeProps) {
  const text = reason?.trim();

  return (
    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
      <p className="text-sm font-semibold text-red-950">{title}</p>
      {text ? (
        <p className="mt-2 text-sm text-red-900 whitespace-pre-wrap">{text}</p>
      ) : (
        <p className="mt-2 text-sm text-red-800">No additional reason was provided.</p>
      )}
      <button
        type="button"
        onClick={onConfirm}
        disabled={confirming}
        className="mt-3 w-full sm:w-auto px-4 py-2 bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg"
      >
        {confirming ? "Saving…" : "Confirm"}
      </button>
    </div>
  );
}

interface CloseReasonFormProps {
  label: string;
  placeholder: string;
  confirmLabel: string;
  confirming?: boolean;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function CloseReasonForm({
  label,
  placeholder,
  confirmLabel,
  confirming,
  value,
  error,
  onChange,
  onConfirm,
  onCancel,
}: CloseReasonFormProps) {
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-sm font-medium text-neutral-900">{label}</span>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder={placeholder}
          className="mt-1.5 w-full bg-white border border-border rounded-lg px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:border-neutral-400"
        />
      </label>
      <p className="text-xs text-neutral-500">{value.trim().length}/1000</p>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onConfirm}
          disabled={confirming || !value.trim()}
          className="flex-1 py-2.5 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors"
        >
          {confirming ? "Saving…" : confirmLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={confirming}
          className="flex-1 py-2.5 border border-border text-neutral-700 hover:bg-white disabled:opacity-50 font-medium rounded-lg text-sm transition-colors"
        >
          Back
        </button>
      </div>
    </div>
  );
}
