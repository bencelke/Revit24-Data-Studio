import type { Metadata } from "next";
import { AppShell } from "@/components/layout";
import { ResultsClient } from "@/components/results/ResultsClient";
import { getExtractorPageData } from "@/lib/services/instagramPublicExtractorService";

export const metadata: Metadata = {
  title: "Results",
};

export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  const pageData = await getExtractorPageData();

  return (
    <AppShell
      title="Results"
      description="Review extracted profiles stored in Firestore and export CSV"
    >
      <ResultsClient {...pageData} initialResults={[]} />
    </AppShell>
  );
}
