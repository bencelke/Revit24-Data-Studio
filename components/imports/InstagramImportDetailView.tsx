import Link from "next/link";
import { ArrowLeft, Copy, FileWarning, Layers, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImportStatusBadge } from "./ImportStatusBadge";
import { ImportSummaryCard } from "./ImportSummaryCard";
import { DataModeBadge } from "./DataModeBadge";
import { InstagramImportRecordsTable } from "./InstagramImportRecordsTable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatImportDate } from "@/lib/services/importService";
import type {
  ImportDataMode,
  ImportJobWithRecords,
} from "@/lib/types/import-jobs";

interface InstagramImportDetailViewProps {
  job: ImportJobWithRecords;
  dataMode: ImportDataMode;
  firebaseConfigured: boolean;
}

export function InstagramImportDetailView({
  job,
  dataMode,
  firebaseConfigured,
}: InstagramImportDetailViewProps) {
  const records = job.records ?? [];
  const errorRecords = records.filter((record) => record.status === "invalid");
  const duplicateRecords = records.filter((record) => record.status === "duplicate");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/imports/history" />}
          className="gap-1.5 px-0 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to history
        </Button>
        <DataModeBadge
          dataMode={dataMode}
          firebaseConfigured={firebaseConfigured}
        />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold tracking-tight">{job.name}</h2>
            <ImportStatusBadge status={job.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Instagram Profile Links · Pending extraction
          </p>
        </div>

        <div className="grid gap-2 text-sm sm:text-right">
          <p className="text-muted-foreground">
            Created by{" "}
            <span className="text-foreground">{job.createdBy}</span>
          </p>
          <p className="text-muted-foreground">
            {formatImportDate(job.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ImportSummaryCard
          label="Total Records"
          value={job.totalRecords.toLocaleString()}
          icon={Layers}
        />
        <ImportSummaryCard
          label="Valid Profiles"
          value={job.validRecords.toLocaleString()}
          icon={ListChecks}
        />
        <ImportSummaryCard
          label="Duplicates"
          value={job.duplicateRecords.toLocaleString()}
          icon={Copy}
        />
        <ImportSummaryCard
          label="Invalid Rows"
          value={job.invalidRecords.toLocaleString()}
          icon={FileWarning}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border bg-card shadow-none">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Summary</CardTitle>
            <CardDescription>Validation statistics for this job</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Status: {job.status}</p>
            <p>Valid records: {job.validRecords}</p>
            <p>Duplicates: {duplicateRecords.length}</p>
            <p>Errors: {errorRecords.length}</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-none">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Errors</CardTitle>
            <CardDescription>Invalid rows from bulk input</CardDescription>
          </CardHeader>
          <CardContent>
            {errorRecords.length === 0 ? (
              <p className="text-sm text-muted-foreground">No invalid rows.</p>
            ) : (
              <ul className="space-y-1 text-sm text-muted-foreground">
                {errorRecords.slice(0, 5).map((record) => (
                  <li key={record.id}>
                    {record.originalInput.trim() || "(empty)"}: {record.error}
                  </li>
                ))}
                {errorRecords.length > 5 ? (
                  <li>+ {errorRecords.length - 5} more</li>
                ) : null}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card shadow-none">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Normalized Records
          </CardTitle>
          <CardDescription>
            User-provided profile links and validation results — no scraped
            metadata yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InstagramImportRecordsTable records={records} />
        </CardContent>
      </Card>
    </div>
  );
}
