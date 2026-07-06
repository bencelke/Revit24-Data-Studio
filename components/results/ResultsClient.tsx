"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InstagramResultsTable } from "./InstagramResultsTable";
import { ResultsActions } from "./ResultsActions";
import { buildInstagramExtractionCsv, downloadCsv } from "@/lib/utils/csvExport";
import {
  clearExtractionResults,
  loadExtractionResults,
  saveExtractionResults,
} from "@/lib/utils/extractionStorage";
import type { ExtractedInstagramProfile, ExtractorPageData } from "@/lib/types/instagramExtraction";

type ResultsClientProps = ExtractorPageData;

export function ResultsClient({ extractorMode }: ResultsClientProps) {
  const [rows, setRows] = useState<ExtractedInstagramProfile[]>(() => loadExtractionResults());

  function persist(next: ExtractedInstagramProfile[]) {
    setRows(next);
    saveExtractionResults(next);
  }

  function handleExportCsv() {
    if (rows.length === 0) return;
    const csv = buildInstagramExtractionCsv(rows);
    downloadCsv(`revit24-instagram-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  function handleClear() {
    clearExtractionResults();
    setRows([]);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Badge variant={extractorMode === "live" ? "default" : "outline"}>
          {extractorMode === "live" ? "Live extraction" : "Mock extraction"}
        </Badge>
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/instagram-extractor" />}>
          Back to Extractor
        </Button>
      </div>

      <ResultsActions
        hasResults={rows.length > 0}
        onExportCsv={handleExportCsv}
        onClear={handleClear}
      />

      <InstagramResultsTable
        rows={rows}
        onRemove={(id) => persist(rows.filter((row) => row.id !== id))}
      />
    </div>
  );
}
