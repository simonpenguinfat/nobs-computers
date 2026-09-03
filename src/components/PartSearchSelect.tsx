"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { NONE_PART, OTHER_PART } from "@/lib/types";

interface PartSearchSelectProps {
  label?: string;
  value: string;
  options: string[];
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onChange: (value: string) => void;
  allowNone?: boolean;
  allowOther?: boolean;
  placeholder?: string;
}

export default function PartSearchSelect({
  label,
  value,
  options,
  open,
  onToggle,
  onClose,
  onChange,
  allowNone = true,
  allowOther = true,
  placeholder = "Select a model…",
}: PartSearchSelectProps) {
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const customRef = useRef<HTMLInputElement>(null);

  const catalog = useMemo(
    () => options.filter((option) => option !== NONE_PART && option !== OTHER_PART),
    [options]
  );

  const listed = catalog.includes(value);
  const otherMode =
    allowOther &&
    value !== NONE_PART &&
    (value === OTHER_PART || (!listed && value.trim() !== ""));

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return catalog;
    return catalog.filter((option) => option.toLowerCase().includes(needle));
  }, [catalog, query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    searchRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (otherMode && value === OTHER_PART) {
      customRef.current?.focus();
    }
  }, [otherMode, value]);

  useEffect(() => {
    if (!open) return;

    function handlePointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        onClose();
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  const display = value?.trim()
    ? value === OTHER_PART
      ? OTHER_PART
      : value
    : allowNone
      ? NONE_PART
      : placeholder;

  const isPlaceholder = !value?.trim() || value === NONE_PART || value === OTHER_PART;

  return (
    <div ref={rootRef} className={`relative ${open ? "z-20" : "z-10"}`}>
      {label ? (
        <p className="text-xs font-medium text-neutral-500 mb-1">{label}</p>
      ) : null}
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center justify-between gap-2 bg-white border border-border rounded-lg px-3 py-2.5 text-sm text-left ${
          open ? "border-brand-500 ring-2 ring-brand-500/20" : ""
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`truncate ${isPlaceholder ? "text-neutral-500" : "text-neutral-900"}`}>
          {display}
        </span>
        <span className="text-neutral-400 text-xs shrink-0">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div className="absolute z-40 mt-1 w-full bg-white border border-border rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={label ? `Search ${label.toLowerCase()}…` : "Search…"}
              className="w-full bg-surface-light border border-border rounded-md px-2.5 py-1.5 text-sm"
            />
          </div>
          <ul className="max-h-40 overflow-y-auto py-1" role="listbox">
            {allowNone && (
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onChange(NONE_PART);
                    onClose();
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-brand-50 ${
                    value === NONE_PART || !value
                      ? "bg-brand-50 font-medium text-brand-700"
                      : "text-neutral-600"
                  }`}
                >
                  None
                </button>
              </li>
            )}
            {filtered.map((option) => (
              <li key={option}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option);
                    onClose();
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-brand-50 ${
                    value === option ? "bg-brand-50 font-medium text-brand-700" : "text-neutral-800"
                  }`}
                >
                  {option}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-neutral-500">No matching models</li>
            )}
          </ul>
          {allowOther && (
            <div className="border-t border-border">
              <button
                type="button"
                onClick={() => {
                  onChange(otherMode && value !== OTHER_PART ? value : OTHER_PART);
                  onClose();
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-brand-50 ${
                  otherMode ? "bg-brand-50 font-medium text-brand-700" : "text-neutral-600"
                }`}
              >
                Other
              </button>
            </div>
          )}
        </div>
      )}

      {otherMode && (
        <input
          ref={customRef}
          type="text"
          value={value === OTHER_PART ? "" : value}
          onChange={(e) => onChange(e.target.value.trim() ? e.target.value : OTHER_PART)}
          placeholder="Enter part name"
          className="mt-1.5 w-full bg-white border border-border rounded-lg px-3 py-2 text-sm"
        />
      )}
    </div>
  );
}
