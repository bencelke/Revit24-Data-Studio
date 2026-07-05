import type { Metadata } from "next";
import { AppShell } from "@/components/layout";
import { ImportPageNav } from "@/components/imports";
import { CsvImportClient } from "@/components/csv";
import { getCsvImportPageData } from "@/lib/services/csvImportService";

export const metadata: Metadata = {
  title: "New CSV Import",
};

export default function NewCsvImportPage() {
  const data = getCsvImportPageData();

  return (
    <AppShell
      title="New CSV Import"
      description="Upload, map columns, validate, and import records"
    >
      <div className="space-y-6">
        <ImportPageNav active="new" />
        <CsvImportClient {...data} />
      </div>
    </AppShell>
  );
}
