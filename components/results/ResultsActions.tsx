"use client";

import { Download, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResultsActionsProps {
  hasResults: boolean;
  isUploading?: boolean;
  onExportCsv: () => void;
  onUpload: () => void;
  onClear: () => void;
}

export function ResultsActions({
  hasResults,
  isUploading,
  onExportCsv,
  onUpload,
  onClear,
}: ResultsActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" onClick={onExportCsv} disabled={!hasResults}>
        <Download className="mr-2 size-4" />
        Export CSV
      </Button>
      <Button onClick={onUpload} disabled={!hasResults || isUploading}>
        <Send className="mr-2 size-4" />
        {isUploading ? "Uploading..." : "Upload to Revit24"}
      </Button>
      <Button variant="outline" onClick={onClear} disabled={!hasResults}>
        <Trash2 className="mr-2 size-4" />
        Clear Results
      </Button>
    </div>
  );
}
