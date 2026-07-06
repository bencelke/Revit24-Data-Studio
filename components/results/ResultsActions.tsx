"use client";

import { Download, FileJson, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResultsActionsProps {
  hasExtractedRecords: boolean;
  hasResults: boolean;
  isClearing?: boolean;
  onExportCsv: () => void;
  onExportJson: () => void;
  onClear: () => void;
}

export function ResultsActions({
  hasExtractedRecords,
  hasResults,
  isClearing,
  onExportCsv,
  onExportJson,
  onClear,
}: ResultsActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" onClick={onExportJson} disabled={!hasExtractedRecords}>
        <FileJson className="mr-2 size-4" />
        Export JSON
      </Button>
      <Button variant="secondary" onClick={onExportCsv} disabled={!hasExtractedRecords}>
        <Download className="mr-2 size-4" />
        Export CSV
      </Button>
      <Button variant="outline" onClick={onClear} disabled={!hasResults || Boolean(isClearing)}>
        <Trash2 className="mr-2 size-4" />
        {isClearing ? "Clearing..." : "Clear Results"}
      </Button>
    </div>
  );
}
