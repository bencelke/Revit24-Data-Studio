import type { Metadata } from "next";
import { AppShell } from "@/components/layout";
import { ResultsClient } from "@/components/results/ResultsClient";
import { getSimpleImportPageData } from "@/lib/services/simpleInstagramImportService";

export const metadata: Metadata = {
  title: "Results",
};

export default async function ResultsPage() {
  const data = await getSimpleImportPageData();

  return (
    <AppShell
      title="Results"
      description="Review extracted profiles and upload to Revit24"
    >
      <ResultsClient {...data} />
    </AppShell>
  );
}
