"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  formatCad,
  normalizeQuote,
  quoteTotal,
  visibleParts,
} from "@/lib/build-quotes";
import type { BuildQuote } from "@/lib/types";
import BuildQuotePartsList from "@/components/BuildQuotePartsList";

interface BuyerBuildQuotesProps {
  buildRequestId: string;
}

export default function BuyerBuildQuotes({ buildRequestId }: BuyerBuildQuotesProps) {
  const supabase = useMemo(() => createClient(), []);
  const [quotes, setQuotes] = useState<BuildQuote[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data } = await supabase
        .from("build_quotes")
        .select("*")
        .eq("build_request_id", buildRequestId)
        .order("created_at", { ascending: true });

      if (cancelled) return;

      const next = (data ?? []).map((row) =>
        normalizeQuote(row as Record<string, unknown>)
      );
      setQuotes(next);
      setSelectedId((current) => {
        if (current && next.some((quote) => quote.id === current)) return current;
        return next[0]?.id ?? null;
      });
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel(`buyer-quotes-${buildRequestId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "build_quotes",
          filter: `build_request_id=eq.${buildRequestId}`,
        },
        () => {
          load();
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [supabase, buildRequestId]);

  const selected = quotes.find((quote) => quote.id === selectedId) ?? quotes[0] ?? null;

  if (loading) {
    return (
      <div className="bg-surface-card border border-border rounded-xl p-5 sm:p-6">
        <h3 className="font-semibold text-neutral-900 mb-2">Suggested builds</h3>
        <p className="text-sm text-neutral-500">Loading parts list…</p>
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="bg-surface-card border border-border rounded-xl p-5 sm:p-6">
        <h3 className="font-semibold text-neutral-900 mb-2">Suggested builds</h3>
        <p className="text-sm text-neutral-500">
          Your builder will post one or more PC drafts here — each with a parts list
          and clickable prices linking to where the parts are sourced.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface-card border border-border rounded-xl p-5 sm:p-6 space-y-4">
      <div>
        <h3 className="font-semibold text-neutral-900">Suggested builds</h3>
        <p className="text-sm text-neutral-500 mt-1">
          Click a price to open the product page for that part.
        </p>
      </div>

      {quotes.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {quotes.map((quote) => {
            const total = quoteTotal(visibleParts(quote.parts));
            const active = quote.id === selected?.id;
            return (
              <button
                key={quote.id}
                type="button"
                onClick={() => setSelectedId(quote.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  active
                    ? "bg-neutral-950 text-white border-neutral-950"
                    : "bg-white text-neutral-700 border-border hover:border-neutral-400"
                }`}
              >
                {quote.title}
                {total > 0 ? ` · ${formatCad(total)}` : ""}
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="space-y-3">
          {quotes.length === 1 && (
            <p className="font-medium text-neutral-900">{selected.title}</p>
          )}
          {selected.notes && (
            <p className="text-sm text-neutral-600">{selected.notes}</p>
          )}
          <BuildQuotePartsList quote={selected} />
        </div>
      )}
    </div>
  );
}
