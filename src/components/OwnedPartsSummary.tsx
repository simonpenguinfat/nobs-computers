import { partCategoryLabel } from "@/lib/types";
import { ownedPartsToDisplay } from "@/lib/owned-parts";

export default function OwnedPartsSummary({
  raw,
  heading = "Existing parts",
}: {
  raw: string;
  heading?: string;
}) {
  const rows = ownedPartsToDisplay(raw);

  if (rows.length === 0) {
    return (
      <div className="space-y-1.5">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          {heading}
        </p>
        <p className="text-sm text-neutral-500">None</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 mb-3">
        {heading}
      </p>
      <div className="overflow-x-auto rounded-lg border border-border bg-neutral-50 px-4 py-2">
        <table className="w-full text-sm">
          <tbody>
            {rows.map((row) => (
              <tr key={row.category} className="border-b border-border last:border-0">
                <td className="py-2.5 pr-4 text-neutral-500 whitespace-nowrap w-20 align-top">
                  {partCategoryLabel(row.category)}
                </td>
                <td className="py-2.5 text-neutral-900 leading-relaxed">{row.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
