import { formatCad, safePartUrl, quoteTotal, visibleParts } from "@/lib/build-quotes";
import { partCategoryLabel, type BuildQuote, type BuildQuotePart } from "@/lib/types";

function PriceCell({ part }: { part: BuildQuotePart }) {
  const href = safePartUrl(part.url);
  const label = formatCad(part.price);

  if (!href) {
    return <span className="font-medium text-neutral-900">{label}</span>;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-brand-600 hover:text-brand-500 underline underline-offset-2"
    >
      {label}
    </a>
  );
}

export default function BuildQuotePartsList({
  quote,
  emptyLabel = "No parts listed yet.",
}: {
  quote: BuildQuote;
  emptyLabel?: string;
}) {
  const parts = visibleParts(quote.parts);
  const total = quoteTotal(parts);

  if (parts.length === 0) {
    return <p className="text-sm text-neutral-500">{emptyLabel}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-neutral-500 border-b border-border">
            <th className="py-2 pr-3 font-medium">Part</th>
            <th className="py-2 pr-3 font-medium">Item</th>
            <th className="py-2 font-medium text-right">Price</th>
          </tr>
        </thead>
        <tbody>
          {parts.map((part) => (
            <tr key={part.id} className="border-b border-border last:border-0">
              <td className="py-2.5 pr-3 text-neutral-500 whitespace-nowrap align-top">
                {partCategoryLabel(part.category)}
              </td>
              <td className="py-2.5 pr-3 text-neutral-900 align-top">
                {part.name || "—"}
              </td>
              <td className="py-2.5 text-right whitespace-nowrap align-top">
                <PriceCell part={part} />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={2} className="pt-3 text-sm font-semibold text-neutral-900">
              Total
            </td>
            <td className="pt-3 text-right font-semibold text-neutral-950">
              {formatCad(total)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
