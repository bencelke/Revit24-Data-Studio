import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/layout";
import { ImportPageNav } from "@/components/imports";
import { Button } from "@/components/ui/button";
import { getCsvImportHistoryData } from "@/lib/services/csvImportService";

export const metadata: Metadata = {
  title: "CSV Import",
};

export default async function CsvImportHubPage() {
  await getCsvImportHistoryData();

  return (
    <AppShell
      title="CSV Bulk Import"
      description="Upload spreadsheet files and import automotive records into the review pipeline"
    >
      <div className="space-y-6">
        <ImportPageNav active="new" />
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">CSV Import Center</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Import clubs, shops, events, websites, and business records from CSV files.
            Records go through validation, duplicate detection, normalization, and admin review.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button nativeButton={false} render={<Link href="/imports/csv/new" />}>
              New CSV Import
            </Button>
            <Button variant="secondary" nativeButton={false} render={<Link href="/imports/csv/history" />}>
              Import History
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
