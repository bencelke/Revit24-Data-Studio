"use client";

import { Badge } from "@/components/ui/badge";
import type { CsvImportPreviewRow } from "@/lib/types/csv-import";
import { CsvDuplicateWarnings } from "./CsvDuplicateWarnings";

interface CsvPreviewTableProps {
  rows: CsvImportPreviewRow[];
  limit?: number;
}

const statusStyles: Record<CsvImportPreviewRow["validationStatus"], string> = {
  valid: "border-green-500/30 bg-green-500/10 text-green-400",
  invalid: "border-red-500/30 bg-red-500/10 text-red-400",
  duplicate: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  warning: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
};

export function CsvPreviewTable({ rows, limit }: CsvPreviewTableProps) {
  const display = limit ? rows.slice(0, limit) : rows;

  return (
    <div className="rounded-lg border border-border overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="p-3">Row</th>
            <th className="p-3">Name</th>
            <th className="p-3">Type</th>
            <th className="p-3">City</th>
            <th className="p-3">Instagram</th>
            <th className="p-3">Website</th>
            <th className="p-3">Email</th>
            <th className="p-3">Status</th>
            <th className="p-3">Issues</th>
          </tr>
        </thead>
        <tbody>
          {display.length === 0 ? (
            <tr>
              <td colSpan={9} className="p-6 text-center text-muted-foreground">
                No rows to preview.
              </td>
            </tr>
          ) : (
            display.map((row) => (
              <tr key={row.rowNumber} className="border-b border-border last:border-0">
                <td className="p-3">{row.rowNumber}</td>
                <td className="p-3 font-medium">{row.mappedData.name ?? "—"}</td>
                <td className="p-3">{row.mappedData.type ?? "—"}</td>
                <td className="p-3">{row.mappedData.city ?? "—"}</td>
                <td className="p-3">{row.mappedData.instagram ?? "—"}</td>
                <td className="p-3 max-w-[120px] truncate">{row.mappedData.website ?? "—"}</td>
                <td className="p-3">{row.mappedData.email ?? "—"}</td>
                <td className="p-3">
                  <Badge variant="outline" className={statusStyles[row.validationStatus]}>
                    {row.validationStatus}
                  </Badge>
                </td>
                <td className="p-3">
                  {row.errors.length > 0 ? (
                    <span className="text-xs text-red-400">{row.errors.join("; ")}</span>
                  ) : row.warnings.length > 0 ? (
                    <span className="text-xs text-yellow-400">{row.warnings.join("; ")}</span>
                  ) : row.duplicateMatches.length > 0 ? (
                    <CsvDuplicateWarnings matches={row.duplicateMatches} compact />
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {limit && rows.length > limit ? (
        <p className="border-t border-border p-3 text-xs text-muted-foreground">
          Showing first {limit} of {rows.length} rows
        </p>
      ) : null}
    </div>
  );
}
