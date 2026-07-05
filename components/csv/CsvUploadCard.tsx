"use client";

import { Upload } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CSV_IMPORT_CONFIG } from "@/lib/config/csv-import";

interface CsvUploadCardProps {
  onFileSelect: (file: File, content: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function CsvUploadCard({ onFileSelect, isLoading, error }: CsvUploadCardProps) {
  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    onFileSelect(file, content);
  }

  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Upload CSV File</CardTitle>
        <CardDescription>
          Max {CSV_IMPORT_CONFIG.maxFileSizeBytes / (1024 * 1024)} MB · up to {CSV_IMPORT_CONFIG.maxRows.toLocaleString()} rows
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 p-8 transition-colors hover:bg-muted/40">
          <Upload className="mb-3 size-8 text-muted-foreground" />
          <span className="text-sm font-medium">Click to upload or drag and drop</span>
          <span className="mt-1 text-xs text-muted-foreground">CSV files only</span>
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleChange}
            disabled={isLoading}
          />
        </label>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
