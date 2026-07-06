import type { Metadata } from "next";
import { AppShell } from "@/components/layout";
import { ResultsClient } from "@/components/results/ResultsClient";
import { getExtractorPageData } from "@/lib/services/instagramPublicExtractorService";

export const metadata: Metadata = {
  title: "Results",
};

export default async function ResultsPage() {
  const data = await getExtractorPageData();

  return (
    <AppShell
      title="Results"
      description="Review extracted profiles and export CSV"
    >
      <ResultsClient {...data} />
    </AppShell>
  );
}
