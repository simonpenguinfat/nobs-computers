"use client";

import { useState } from "react";
import {
  OWNABLE_PART_CATEGORIES,
  partCategoryLabel,
} from "@/lib/types";
import { partOptions } from "@/lib/owned-parts";
import type { OwnedPartsSelection } from "@/lib/owned-parts";
import PartSearchSelect from "@/components/PartSearchSelect";

interface ExistingPartsPickerProps {
  value: OwnedPartsSelection;
  onChange: (value: OwnedPartsSelection) => void;
}

export default function ExistingPartsPicker({
  value,
  onChange,
}: ExistingPartsPickerProps) {
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  return (
    <div>
      <p className="block text-sm font-medium mb-1.5 text-neutral-700">
        Parts you already own
      </p>
      <p className="text-xs text-neutral-500 mb-3">
        Leave a part as None if we should supply it. Search and pick a model, or
        choose Other to type a name that isn&apos;t listed.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-visible">
        {OWNABLE_PART_CATEGORIES.map((category) => (
          <PartSearchSelect
            key={category}
            label={partCategoryLabel(category)}
            value={value[category] ?? "None"}
            options={partOptions(category)}
            allowNone
            allowOther
            open={openCategory === category}
            onToggle={() =>
              setOpenCategory((current) => (current === category ? null : category))
            }
            onClose={() => setOpenCategory(null)}
            onChange={(next) => onChange({ ...value, [category]: next })}
          />
        ))}
      </div>
    </div>
  );
}
