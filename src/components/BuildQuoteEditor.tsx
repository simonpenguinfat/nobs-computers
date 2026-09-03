"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PART_CATEGORIES, partCategoryLabel, type BuildQuote, type BuildQuotePart } from "@/lib/types";
import {
  defaultPartsList,
  emptyPart,
  formatCad,
  normalizeQuote,
  quoteTotal,
} from "@/lib/build-quotes";

interface BuildQuoteEditorProps {
  buildRequestId: string;
  onUseAsEstimate?: (total: number) => void;
}

interface DraftState {
  title: string;
  notes: string;
  parts: BuildQuotePart[];
}

function toDraft(quote: BuildQuote): DraftState {
  return {
    title: quote.title,
    notes: quote.notes,
    parts: quote.parts.length > 0 ? quote.parts : defaultPartsList(),
  };
}

export default function BuildQuoteEditor({
  buildRequestId,
  onUseAsEstimate,
}: BuildQuoteEditorProps) {
  const supabase = useMemo(() => createClient(), []);
  const [quotes, setQuotes] = useState<BuildQuote[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);

  const loadQuotes = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("build_quotes")
      .select("*")
      .eq("build_request_id", buildRequestId)
      .order("created_at", { ascending: true });

    if (fetchError) {
      const lower = fetchError.message.toLowerCase();
      setError(
        lower.includes("does not exist") || lower.includes("schema cache")
          ? "Parts lists aren't set up yet. Run build-quotes.sql in the Supabase SQL Editor, then refresh."
          : fetchError.message
      );
      return;
    }

    const next = (data ?? []).map((row) =>
      normalizeQuote(row as Record<string, unknown>)
    );
    setQuotes(next);
    setDrafts((current) => {
      const updated: Record<string, DraftState> = {};
      for (const quote of next) {
        updated[quote.id] = current[quote.id] ?? toDraft(quote);
      }
      return updated;
    });
  }, [supabase, buildRequestId]);

  useEffect(() => {
    void loadQuotes();
  }, [loadQuotes]);

  function updateDraft(id: string, patch: Partial<DraftState>) {
    setDrafts((current) => ({
      ...current,
      [id]: { ...current[id], ...patch },
    }));
    setSavedId((current) => (current === id ? null : current));
  }

  function updatePart(quoteId: string, partId: string, patch: Partial<BuildQuotePart>) {
    const draft = drafts[quoteId];
    if (!draft) return;
    updateDraft(quoteId, {
      parts: draft.parts.map((part) =>
        part.id === partId ? { ...part, ...patch } : part
      ),
    });
  }

  async function addDraft(copyFrom?: DraftState) {
    setAdding(true);
    setError("");

    const title = copyFrom
      ? `${copyFrom.title} (copy)`
      : `Option ${quotes.length + 1}`;

    const { data, error: insertError } = await supabase
      .from("build_quotes")
      .insert({
        build_request_id: buildRequestId,
        title,
        notes: copyFrom?.notes ?? "",
        parts: copyFrom?.parts ?? defaultPartsList(),
      })
      .select("*")
      .single();

    if (insertError) {
      setError(
        insertError.message.toLowerCase().includes("does not exist")
          ? "Parts lists aren't set up yet. Run build-quotes.sql in the Supabase SQL Editor, then try again."
          : insertError.message
      );
      setAdding(false);
      return;
    }

    if (data) {
      const quote = normalizeQuote(data as Record<string, unknown>);
      setQuotes((current) => [...current, quote]);
      setDrafts((current) => ({ ...current, [quote.id]: toDraft(quote) }));
    }

    setAdding(false);
  }

  async function saveDraft(id: string) {
    const draft = drafts[id];
    if (!draft) return;

    setSavingId(id);
    setError("");

    const { error: updateError } = await supabase
      .from("build_quotes")
      .update({
        title: draft.title.trim() || "Draft",
        notes: draft.notes,
        parts: draft.parts,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSavedId(id);
    }

    setSavingId(null);
  }

  async function deleteDraft(id: string) {
    if (!confirm("Delete this draft? The customer will no longer see it.")) return;

    const { error: deleteError } = await supabase
      .from("build_quotes")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setQuotes((current) => current.filter((quote) => quote.id !== id));
    setDrafts((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  return (
    <div className="mt-6 pt-6 border-t border-border space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="font-semibold text-neutral-900">Suggested PC drafts</h3>
          <p className="text-sm text-neutral-500 mt-0.5">
            Add one or more parts lists. Put a product URL on each price so the
            customer can click through.
          </p>
        </div>
        <button
          type="button"
          onClick={() => addDraft()}
          disabled={adding}
          className="shrink-0 px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {adding ? "Adding…" : "Add draft"}
        </button>
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      {quotes.length === 0 && (
        <p className="text-sm text-neutral-500 bg-surface-light border border-border rounded-lg p-4">
          No drafts yet. Add a draft to start a CPU / GPU / RAM list for this customer.
        </p>
      )}

      {quotes.map((quote) => {
        const draft = drafts[quote.id] ?? toDraft(quote);
        const total = quoteTotal(draft.parts);

        return (
          <div
            key={quote.id}
            className="border border-border rounded-xl p-4 sm:p-5 bg-surface-light space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-neutral-500 block mb-1">Draft name</label>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(e) => updateDraft(quote.id, { title: e.target.value })}
                  className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-500 block mb-1">Notes (optional)</label>
                <input
                  type="text"
                  value={draft.notes}
                  onChange={(e) => updateDraft(quote.id, { notes: e.target.value })}
                  placeholder="e.g. Reuses their existing case"
                  className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="hidden sm:grid sm:grid-cols-12 gap-2 text-xs text-neutral-500 px-0.5">
                <span className="col-span-2">Category</span>
                <span className="col-span-4">Item</span>
                <span className="col-span-2">Price (CAD)</span>
                <span className="col-span-3">Product link</span>
                <span className="col-span-1" />
              </div>

              {draft.parts.map((part) => (
                <div
                  key={part.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-white sm:bg-transparent border sm:border-0 border-border rounded-lg p-3 sm:p-0"
                >
                  <select
                    value={
                      PART_CATEGORIES.includes(
                        part.category as (typeof PART_CATEGORIES)[number]
                      )
                        ? part.category
                        : "Other"
                    }
                    onChange={(e) =>
                      updatePart(quote.id, part.id, { category: e.target.value })
                    }
                    className="sm:col-span-2 min-w-0 bg-white border border-border rounded-lg px-2 py-2 text-sm"
                    title={part.category}
                  >
                    {PART_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {partCategoryLabel(category)}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={part.name}
                    onChange={(e) =>
                      updatePart(quote.id, part.id, { name: e.target.value })
                    }
                    placeholder="Product name"
                    className="sm:col-span-4 bg-white border border-border rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={part.price ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      const parsed = parseFloat(value);
                      updatePart(quote.id, part.id, {
                        price: value === "" || Number.isNaN(parsed) ? null : parsed,
                      });
                    }}
                    placeholder="0.00"
                    className="sm:col-span-2 bg-white border border-border rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    value={part.url}
                    onChange={(e) =>
                      updatePart(quote.id, part.id, { url: e.target.value })
                    }
                    placeholder="https://…"
                    className="sm:col-span-3 bg-white border border-border rounded-lg px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateDraft(quote.id, {
                        parts: draft.parts.filter((row) => row.id !== part.id),
                      })
                    }
                    className="sm:col-span-1 text-sm text-red-600 hover:text-red-700 py-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                updateDraft(quote.id, { parts: [...draft.parts, emptyPart()] })
              }
              className="text-sm font-medium text-brand-600 hover:text-brand-500"
            >
              + Add part
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-border">
              <p className="text-sm font-semibold text-neutral-950">
                Total {formatCad(total)}
              </p>
              <div className="flex flex-wrap gap-2">
                {onUseAsEstimate && total > 0 && (
                  <button
                    type="button"
                    onClick={() => onUseAsEstimate(total)}
                    className="px-3 py-2 border border-border rounded-lg text-sm text-neutral-700 hover:bg-white"
                  >
                    Use as estimate
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => addDraft(draft)}
                  disabled={adding}
                  className="px-3 py-2 border border-border rounded-lg text-sm text-neutral-700 hover:bg-white"
                >
                  Duplicate
                </button>
                <button
                  type="button"
                  onClick={() => deleteDraft(quote.id)}
                  className="px-3 py-2 border border-red-200 text-red-700 rounded-lg text-sm hover:bg-red-50"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => saveDraft(quote.id)}
                  disabled={savingId === quote.id}
                  className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 disabled:opacity-50 text-white text-sm font-medium rounded-lg"
                >
                  {savingId === quote.id
                    ? "Saving…"
                    : savedId === quote.id
                      ? "Saved"
                      : "Save draft"}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
