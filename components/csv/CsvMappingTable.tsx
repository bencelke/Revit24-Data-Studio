"use client";

import type { CsvFieldMapping, CsvTargetField } from "@/lib/types/csv-import";
import { CSV_TARGET_FIELDS } from "@/lib/types/csv-import";
import { getFieldRequirementLabel } from "@/lib/services/csvMappingService";

interface CsvMappingTableProps {
  headers: string[];
  mapping: CsvFieldMapping;
  onChange: (field: CsvTargetField, sourceColumn: string) => void;
  previewRows?: Record<string, string>[];
}

export function CsvMappingTable({ headers, mapping, onChange, previewRows = [] }: CsvMappingTableProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="p-3">Target Field</th>
              <th className="p-3">Required</th>
              <th className="p-3">Source Column</th>
              <th className="p-3">Sample Value</th>
            </tr>
          </thead>
          <tbody>
            {CSV_TARGET_FIELDS.map((field) => {
              const sourceCol = mapping[field] ?? "";
              const sample = previewRows[0]?.[sourceCol] ?? previewRows[0]?.[sourceCol.toLowerCase()] ?? "—";
              return (
                <tr key={field} className="border-b border-border last:border-0">
                  <td className="p-3 font-medium">{field}</td>
                  <td className="p-3 capitalize text-muted-foreground">
                    {getFieldRequirementLabel(field)}
                  </td>
                  <td className="p-3">
                    <select
                      value={sourceCol}
                      onChange={(e) => onChange(field, e.target.value)}
                      className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                    >
                      <option value="">— Not mapped —</option>
                      {headers.map((header) => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 max-w-[200px] truncate text-muted-foreground">{sample || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
