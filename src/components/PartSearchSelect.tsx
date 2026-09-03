"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { NONE_PART } from "@/lib/types";

interface PartSearchSelectProps {
  label: string;
  value: string;
  options: string[];
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onChange: (value: string) => void;
}

export default function PartSearchSelect({
  label,
  value,
  options,
  open,
  onToggle,
  onClose,
  onChange,
}: PartSearchSelectProps) {
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const models = options.filter((option) => option !== NONE_PART);
    if (!needle) return models;
    return models.filter((option) => option.toLowerCase().includes(needle));
  }, [options, query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    searchRef.current?.focus();
  }, [open]);

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

  const display = value?.trim() || NONE_PART;

  return (
    <div ref={rootRef} className={`relative ${open ? "z-20" : "z-10"}`}>
      <p className="text-xs font-medium text-neutral-500 mb-1">{label}</p>
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center justify-between gap-2 bg-white border border-border rounded-lg px-3 py-2.5 text-sm text-left ${
          open ? "border-brand-500 ring-2 ring-brand-500/20" : ""
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={display === NONE_PART ? "text-neutral-500" : "text-neutral-900"}>
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
              placeholder={`Search ${label.toLowerCase()}…`}
              className="w-full bg-surface-light border border-border rounded-md px-2.5 py-1.5 text-sm"
            />
          </div>
          <ul className="max-h-48 overflow-y-auto py-1" role="listbox">
            <li>
              <button
                type="button"
                onClick={() => {
                  onChange(NONE_PART);
                  onClose();
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-brand-50 ${
                  display === NONE_PART ? "bg-brand-50 font-medium text-brand-700" : "text-neutral-600"
                }`}
              >
                None
              </button>
            </li>
            {filtered.map((option) => (
              <li key={option}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option);
                    onClose();
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-brand-50 ${
                    display === option ? "bg-brand-50 font-medium text-brand-700" : "text-neutral-800"
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
        </div>
      )}
    </div>
  );
}
