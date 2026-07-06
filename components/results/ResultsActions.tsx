"use client";

import { Download, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResultsActionsProps {
  hasResults: boolean;
  isClearing?: boolean;
  onExportCsv: () => void;
  onClear: () => void;
}

export function ResultsActions({
  hasResults,
  isClearing,
  onExportCsv,
  onClear,
}: ResultsActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" onClick={onExportCsv} disabled={!hasResults}>
        <Download className="mr-2 size-4" />
        Export CSV
      </Button>
      <Button disabled title="Upload to Revit24.com — Coming Next Phase">
        <Send className="mr-2 size-4" />
        Upload to Revit24.com — Coming Next Phase
      </Button>
      <Button variant="outline" onClick={onClear} disabled={!hasResults || isClearing}>
        <Trash2 className="mr-2 size-4" />
        {isClearing ? "Clearing..." : "Clear Results"}
      </Button>
    </div>
  );
}
