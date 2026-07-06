import type { Metadata } from "next";
import { AppShell } from "@/components/layout";
import { ResultsClient } from "@/components/results/ResultsClient";
import {
  getExtractorPageData,
  listExtractionResults,
} from "@/lib/services/instagramPublicExtractorService";

export const metadata: Metadata = {
  title: "Results",
};

export default async function ResultsPage() {
  const [pageData, initialResults] = await Promise.all([
    getExtractorPageData(),
    listExtractionResults(),
  ]);

  return (
    <AppShell
      title="Results"
      description="Review extracted profiles stored in Firestore and export CSV"
    >
      <ResultsClient {...pageData} initialResults={initialResults} />
    </AppShell>
  );
}
