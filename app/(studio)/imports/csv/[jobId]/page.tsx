import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout";
import { ImportPageNav } from "@/components/imports";
import { CsvValidationSummaryCards, CsvPreviewTable } from "@/components/csv";
import { Button } from "@/components/ui/button";
import { DataModeBadge } from "@/components/imports/DataModeBadge";
import { getCsvImportJobDetail } from "@/lib/services/csvImportService";
import { formatImportDate } from "@/lib/services/importService";

interface CsvJobDetailPageProps {
  params: Promise<{ jobId: string }>;
}

export async function generateMetadata({ params }: CsvJobDetailPageProps): Promise<Metadata> {
  const { jobId } = await params;
  const data = await getCsvImportJobDetail(jobId);
  return { title: data ? data.job.fileName : "CSV Import Job" };
}

export default async function CsvJobDetailPage({ params }: CsvJobDetailPageProps) {
  const { jobId } = await params;
  const data = await getCsvImportJobDetail(jobId);
  if (!data) notFound();

  const { job, records, summary, dataMode, firebaseConfigured } = data;

  return (
    <AppShell
      title={job.fileName}
      description="CSV import job details and record preview"
    >
      <div className="space-y-6">
        <ImportPageNav active="history" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <DataModeBadge dataMode={dataMode} firebaseConfigured={firebaseConfigured} />
          <div className="flex gap-2">
            {job.importJobId ? (
              <Button variant="secondary" size="sm" nativeButton={false} render={<Link href={`/imports/${job.importJobId}`} />}>
                View Review Job
              </Button>
            ) : null}
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/imports/csv/history" />}>
              Back to History
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 text-sm">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div><span className="text-muted-foreground">Status:</span> {job.status}</div>
            <div><span className="text-muted-foreground">Uploaded:</span> {formatImportDate(job.uploadedAt)}</div>
            <div><span className="text-muted-foreground">File size:</span> {(job.fileSize / 1024).toFixed(1)} KB</div>
            <div><span className="text-muted-foreground">Total rows:</span> {job.totalRows}</div>
          </div>
        </div>

        <CsvValidationSummaryCards summary={summary} />
        <CsvPreviewTable rows={records.map((r) => ({
          rowNumber: r.rowNumber,
          mappedData: r.mappedData,
          validationStatus: r.validationStatus,
          errors: r.errors,
          warnings: r.warnings,
          duplicateMatches: r.duplicateMatches,
        }))} />
      </div>
    </AppShell>
  );
}
