import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  History,
  Loader2,
  Plus,
  Upload,
} from "lucide-react";
import { AppShell } from "@/components/layout";
import {
  ImportPageNav,
  ImportSummaryCard,
  ImportTable,
} from "@/components/imports";
import { Button } from "@/components/ui/button";
import {
  getImportSummary,
  getRecentImportJobs,
} from "@/lib/services/importService";

export const metadata: Metadata = {
  title: "Imports",
};

export default function ImportsPage() {
  const summary = getImportSummary();
  const recentJobs = getRecentImportJobs(6);

  return (
    <AppShell
      title="Import Center"
      description="Central hub for all data entering Revit24 Data Studio"
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <ImportPageNav active="overview" />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              nativeButton={false}
              render={<Link href="/imports/new" />}
              className="gap-1.5"
            >
              <Plus className="size-4" />
              New Import
            </Button>
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/imports/history" />}
              className="gap-1.5"
            >
              <History className="size-4" />
              View History
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <ImportSummaryCard
            label="Total Imports"
            value={summary.totalImports}
            icon={Upload}
          />
          <ImportSummaryCard
            label="Running"
            value={summary.running}
            description="Active jobs"
            icon={Loader2}
          />
          <ImportSummaryCard
            label="Pending Review"
            value={summary.pendingReview}
            description="Awaiting approval"
            icon={Clock}
          />
          <ImportSummaryCard
            label="Completed Today"
            value={summary.completedToday}
            icon={CheckCircle2}
          />
          <ImportSummaryCard
            label="Failed Today"
            value={summary.failedToday}
            icon={AlertTriangle}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Recent Imports</h2>
              <p className="text-sm text-muted-foreground">
                Latest jobs across all sources
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href="/imports/history" />}
            >
              View all
            </Button>
          </div>

          <ImportTable jobs={recentJobs} showActions sortable={false} />
        </div>
      </div>
    </AppShell>
  );
}
