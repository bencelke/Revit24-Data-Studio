import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/layout";
import { ImportPageNav } from "@/components/imports";
import { CsvImportHistoryTable } from "@/components/csv";
import { Button } from "@/components/ui/button";
import { getCsvImportHistoryData } from "@/lib/services/csvImportService";

export const metadata: Metadata = {
  title: "CSV Import History",
};

export default async function CsvImportHistoryPage() {
  const data = await getCsvImportHistoryData();

  return (
    <AppShell
      title="CSV Import History"
      description="Past CSV bulk import jobs"
    >
      <div className="space-y-6">
        <ImportPageNav active="history" />
        <div className="flex justify-end">
          <Button nativeButton={false} render={<Link href="/imports/csv/new" />}>
            New CSV Import
          </Button>
        </div>
        <CsvImportHistoryTable jobs={data.jobs} />
      </div>
    </AppShell>
  );
}
