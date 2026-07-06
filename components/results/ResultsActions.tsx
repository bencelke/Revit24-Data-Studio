"use client";

import { Download, FileJson, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExportScopeSelector } from "./ExportScopeSelector";
import type { JsonExportScope } from "@/lib/utils/jsonExport";

interface ResultsActionsProps {
  hasExtractedRecords: boolean;
  hasResults: boolean;
  isClearing?: boolean;
  isRefreshing?: boolean;
  exportScope: JsonExportScope;
  onExportScopeChange: (scope: JsonExportScope) => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  onRefresh: () => void;
  onClear: () => void;
}

export function ResultsActions({
  hasExtractedRecords,
  hasResults,
  isClearing,
  isRefreshing,
  exportScope,
  onExportScopeChange,
  onExportJson,
  onExportCsv,
  onRefresh,
  onClear,
}: ResultsActionsProps) {
  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap gap-2">
        <Button onClick={onExportJson} disabled={!hasExtractedRecords}>
          <FileJson className="mr-2 size-4" />
          Export JSON
        </Button>
        <Button variant="secondary" onClick={onExportCsv} disabled={!hasExtractedRecords}>
          <Download className="mr-2 size-4" />
          Export CSV
        </Button>
        <Button variant="outline" onClick={onRefresh} disabled={Boolean(isRefreshing)}>
          <RefreshCw className={`mr-2 size-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Button variant="outline" onClick={onClear} disabled={!hasResults || Boolean(isClearing)}>
          <Trash2 className="mr-2 size-4" />
          {isClearing ? "Clearing..." : "Clear Results"}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Export extracted profiles as JSON for later upload into Revit24.com.
      </p>

      <ExportScopeSelector value={exportScope} onChange={onExportScopeChange} />
    </div>
  );
}
