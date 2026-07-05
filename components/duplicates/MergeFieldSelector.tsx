"use client";

import type { MergeFieldKey, MergeFieldSelection, MergeFieldSelections } from "@/lib/types/duplicates";
import { MERGE_FIELD_KEYS } from "@/lib/types/duplicates";

const FIELD_LABELS: Record<MergeFieldKey, string> = {
  displayName: "Display Name",
  entityType: "Entity Type",
  username: "Username",
  website: "Website",
  publicEmail: "Email",
  publicPhone: "Phone",
  location: "Location",
  description: "Description",
  tags: "Tags",
  vehicleBrands: "Vehicle Brands",
  specialties: "Specialties",
  socialLinks: "Social Links",
};

const SELECTIONS: MergeFieldSelection[] = ["record_a", "record_b", "combine", "clear"];

interface MergeFieldSelectorProps {
  selections: MergeFieldSelections;
  onChange: (field: MergeFieldKey, selection: MergeFieldSelection) => void;
}

export function MergeFieldSelector({ selections, onChange }: MergeFieldSelectorProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Field Selection for Merge</p>
      <div className="rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="p-3">Field</th>
              <th className="p-3">Use Record A</th>
              <th className="p-3">Use Record B</th>
              <th className="p-3">Combine</th>
              <th className="p-3">Clear</th>
            </tr>
          </thead>
          <tbody>
            {MERGE_FIELD_KEYS.map((field) => (
              <tr key={field} className="border-b border-border last:border-0">
                <td className="p-3 font-medium">{FIELD_LABELS[field]}</td>
                {SELECTIONS.map((selection) => (
                  <td key={selection} className="p-3">
                    <input
                      type="radio"
                      name={`merge-field-${field}`}
                      checked={(selections[field] ?? "record_a") === selection}
                      onChange={() => onChange(field, selection)}
                      className="size-4 accent-brand"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
