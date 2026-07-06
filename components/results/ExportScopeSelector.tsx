"use client";

import type { JsonExportScope } from "@/lib/utils/jsonExport";

interface ExportScopeSelectorProps {
  value: JsonExportScope;
  onChange: (value: JsonExportScope) => void;
}

const OPTIONS: { id: JsonExportScope; label: string }[] = [
  { id: "successful", label: "Successful only" },
  { id: "all", label: "All records" },
  { id: "clubs", label: "Clubs only" },
  { id: "members", label: "Members only" },
];

export function ExportScopeSelector({ value, onChange }: ExportScopeSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Export:</span>
      {OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
            value === option.id
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-muted-foreground hover:bg-muted/40"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
