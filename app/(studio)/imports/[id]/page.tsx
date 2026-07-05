import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  FileText,
  Layers,
  Timer,
} from "lucide-react";
import { AppShell } from "@/components/layout";
import {
  EmptyState,
  ImportJobHeader,
  ImportSummaryCard,
  ImportTimeline,
  InstagramImportDetailView,
} from "@/components/imports";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { getImportJobById } from "@/lib/services/importService";
import { getImportJobWithRecords } from "@/lib/services/importJobService";

interface ImportDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ImportDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const instagramJob = await getImportJobWithRecords(id);
  const mockJob = instagramJob ? null : getImportJobById(id);

  return {
    title: instagramJob?.name ?? mockJob?.name ?? "Import Not Found",
  };
}

export default async function ImportDetailPage({
  params,
}: ImportDetailPageProps) {
  const { id } = await params;
  const firebaseConfigured = isFirebaseConfigured();
  const instagramJob = await getImportJobWithRecords(id);

  if (instagramJob) {
    return (
      <AppShell
        title="Import Details"
        description={`Job ${instagramJob.id}`}
      >
        <InstagramImportDetailView
          job={instagramJob}
          dataMode={firebaseConfigured ? "firestore" : "mock"}
          firebaseConfigured={firebaseConfigured}
        />
      </AppShell>
    );
  }

  const job = getImportJobById(id);

  if (!job) {
    notFound();
  }

  return (
    <AppShell
      title="Import Details"
      description={`Job ${job.id}`}
    >
      <div className="space-y-6">
        <ImportJobHeader job={job} />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <ImportSummaryCard
            label="Total Records"
            value={job.totalRecords.toLocaleString()}
            icon={Layers}
          />
          <ImportSummaryCard
            label="Imported"
            value={job.importedRecords.toLocaleString()}
            icon={CheckCircle2}
          />
          <ImportSummaryCard
            label="Duplicates"
            value={job.duplicateRecords.toLocaleString()}
            icon={Copy}
          />
          <ImportSummaryCard
            label="Failed"
            value={job.failedRecords.toLocaleString()}
            icon={AlertTriangle}
          />
          <ImportSummaryCard
            label="Duration"
            value={job.duration ?? "—"}
            icon={Timer}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <ImportTimeline events={job.timeline} />
          </div>

          <div className="space-y-4 lg:col-span-2">
            <Card className="border-border bg-card shadow-none">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Logs</CardTitle>
                <CardDescription>
                  Processing logs will appear here in a future phase
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EmptyState
                  icon={FileText}
                  title="No logs yet"
                  description="Real-time import logs will stream here once queue processing is enabled."
                  className="min-h-36"
                />
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-none">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Errors</CardTitle>
                <CardDescription>
                  Failed record details and error traces
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EmptyState
                  icon={AlertTriangle}
                  title="No error details"
                  description={
                    job.failedRecords > 0
                      ? `${job.failedRecords} records failed. Detailed error reporting coming in a future phase.`
                      : "No errors recorded for this import job."
                  }
                  className="min-h-36"
                />
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-none">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Preview</CardTitle>
                <CardDescription>
                  Sample of imported records before ShiftIt export
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EmptyState
                  icon={Layers}
                  title="Preview unavailable"
                  description="Record preview will be available once import processing is implemented."
                  className="min-h-36"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
