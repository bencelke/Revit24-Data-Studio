"use client";

import { Download, FileJson, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResultsActionsProps {
  hasResults: boolean;
  hasExtractedRecords: boolean;
  hasUploadableRecords: boolean;
  firebaseConnected: boolean;
  isClearing?: boolean;
  isUploading?: boolean;
  onExportCsv: () => void;
  onExportJson: () => void;
  onUploadToRevit24: () => void;
  onClear: () => void;
}

export function ResultsActions({
  hasResults,
  hasExtractedRecords,
  hasUploadableRecords,
  firebaseConnected,
  isClearing,
  isUploading,
  onExportCsv,
  onExportJson,
  onUploadToRevit24,
  onClear,
}: ResultsActionsProps) {
  const uploadDisabled = !firebaseConnected || !hasUploadableRecords || Boolean(isUploading);

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" onClick={onExportCsv} disabled={!hasExtractedRecords}>
        <Download className="mr-2 size-4" />
        Export CSV
      </Button>
      <Button variant="secondary" onClick={onExportJson} disabled={!hasExtractedRecords}>
        <FileJson className="mr-2 size-4" />
        Export JSON
      </Button>
      <Button
        variant="secondary"
        onClick={onUploadToRevit24}
        disabled={uploadDisabled}
        title={
          !firebaseConnected
            ? "Configure Firebase in Vercel to upload to Revit24"
            : !hasUploadableRecords
              ? "No successful extractions to upload"
              : "Upload successful extractions to revit24_import_queue"
        }
      >
        <Send className="mr-2 size-4" />
        {isUploading ? "Uploading..." : "Upload to Revit24"}
      </Button>
      <Button variant="outline" onClick={onClear} disabled={!hasResults || Boolean(isClearing)}>
        <Trash2 className="mr-2 size-4" />
        {isClearing ? "Clearing..." : "Clear Results"}
      </Button>
    </div>
  );
}
