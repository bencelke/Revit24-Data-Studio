"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FirestoreStatusBanner } from "@/components/imports/DataModeBadge";
import { CsvUploadCard } from "./CsvUploadCard";
import { CsvTemplateDownload } from "./CsvTemplateDownload";
import { CsvImportStepper } from "./CsvImportStepper";
import { CsvMappingTable } from "./CsvMappingTable";
import { CsvPreviewTable } from "./CsvPreviewTable";
import { CsvValidationSummaryCards } from "./CsvValidationSummary";
import { CSV_IMPORT_CONFIG } from "@/lib/config/csv-import";
import { MOCK_MODE_WARNING, getErrorMessage } from "@/lib/errors/app-errors";
import { REQUIRED_FIELD_NOTE } from "@/lib/services/csvMappingService";
import type { CsvFieldMapping, CsvImportPageData, CsvImportPreviewRow, CsvTargetField, CsvValidationSummary } from "@/lib/types/csv-import";
import type { CsvParseResult } from "@/lib/types/csv-import";

type WizardStep = "upload" | "mapping" | "preview" | "importing";

type CsvImportClientProps = CsvImportPageData;

export function CsvImportClient({ firebaseConfigured, warning }: CsvImportClientProps) {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>("upload");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [content, setContent] = useState("");
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [mapping, setMapping] = useState<CsvFieldMapping>({});
  const [preview, setPreview] = useState<CsvImportPreviewRow[]>([]);
  const [summary, setSummary] = useState<CsvValidationSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleFileSelect(file: File, fileContent: string) {
    setError(null);
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("content", fileContent);

      const response = await fetch("/api/csv/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: fileContent, fileName: file.name, fileSize: file.size }),
      });

      const data = (await response.json()) as {
        parseResult?: CsvParseResult;
        mapping?: CsvFieldMapping;
        error?: string;
      };

      if (!response.ok) throw new Error(data.error ?? "Failed to parse CSV.");

      setFileName(file.name);
      setFileSize(file.size);
      setContent(fileContent);
      setParseResult(data.parseResult ?? null);
      setMapping(data.mapping ?? {});
      setStep("mapping");
    } catch (uploadError) {
      setError(getErrorMessage(uploadError, "Failed to upload CSV."));
    } finally {
      setIsLoading(false);
    }
  }

  function handleMappingChange(field: CsvTargetField, sourceColumn: string) {
    setMapping((current) => ({
      ...current,
      [field]: sourceColumn || undefined,
    }));
  }

  async function handleValidate() {
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch("/api/csv/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, mapping }),
      });

      const data = (await response.json()) as {
        preview?: CsvImportPreviewRow[];
        summary?: CsvValidationSummary;
        error?: string;
      };

      if (!response.ok) throw new Error(data.error ?? "Validation failed.");

      setPreview(data.preview ?? []);
      setSummary(data.summary ?? null);
      setStep("preview");
    } catch (validateError) {
      setError(getErrorMessage(validateError, "Validation failed."));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleImport() {
    setError(null);
    setIsLoading(true);
    setStep("importing");
    try {
      const response = await fetch("/api/csv/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, fileName, fileSize, mapping }),
      });

      const data = (await response.json()) as { job?: { id: string }; error?: string };

      if (!response.ok) throw new Error(data.error ?? "Import failed.");

      if (data.job) {
        router.push(`/imports/csv/${data.job.id}`);
      }
    } catch (importError) {
      setError(getErrorMessage(importError, "Import failed."));
      setStep("preview");
    } finally {
      setIsLoading(false);
    }
  }

  const stepperStep = step === "upload" ? "upload" : step === "mapping" ? "mapping" : step === "preview" ? "ready" : "importing";

  return (
    <div className="space-y-6">
      {!firebaseConfigured ? (
        <FirestoreStatusBanner variant="warning" title="Mock Mode" description={MOCK_MODE_WARNING} />
      ) : warning ? (
        <FirestoreStatusBanner variant="warning" title="Mock Data" description={warning} />
      ) : null}

      {error ? (
        <FirestoreStatusBanner variant="error" title="Error" description={error} />
      ) : null}

      <CsvImportStepper currentStep={stepperStep} />

      {step === "upload" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <CsvUploadCard onFileSelect={handleFileSelect} isLoading={isLoading} error={error} />
          <CsvTemplateDownload />
        </div>
      ) : null}

      {step === "mapping" && parseResult ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold">Map Columns</h3>
            <p className="text-sm text-muted-foreground">
              {REQUIRED_FIELD_NOTE} Detected {parseResult.headers.length} columns, {parseResult.totalRows} rows.
            </p>
          </div>
          <CsvMappingTable
            headers={parseResult.headers}
            mapping={mapping}
            onChange={handleMappingChange}
            previewRows={parseResult.rows.slice(0, CSV_IMPORT_CONFIG.previewRowLimit)}
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep("upload")}>Back</Button>
            <Button onClick={() => void handleValidate()} disabled={isLoading}>
              Validate & Preview
            </Button>
          </div>
        </div>
      ) : null}

      {step === "preview" || step === "importing" ? (
        <div className="space-y-4">
          <CsvValidationSummaryCards summary={summary} />
          <CsvPreviewTable rows={preview} limit={50} />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep("mapping")} disabled={step === "importing"}>
              Back to Mapping
            </Button>
            <Button onClick={() => void handleImport()} disabled={isLoading || step === "importing"}>
              {isLoading ? "Importing..." : "Create Import Job"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
