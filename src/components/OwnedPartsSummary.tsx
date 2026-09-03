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
      <div>
        <p className="text-xs text-neutral-500">{heading}</p>
        <p className="text-sm text-neutral-900">None</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-neutral-500 mb-2">{heading}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <tbody>
            {rows.map((row) => (
              <tr key={row.category} className="border-b border-border last:border-0">
                <td className="py-1.5 pr-3 text-neutral-500 whitespace-nowrap w-16">
                  {partCategoryLabel(row.category)}
                </td>
                <td className="py-1.5 text-neutral-900">{row.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
