import type { Metadata } from "next";
import { AppShell } from "@/components/layout";
import { InstagramExtractionDashboard } from "@/components/instagram";
import { getInstagramExtractionDashboardData } from "@/lib/services/instagramBulkExtractionService";

export const metadata: Metadata = {
  title: "Instagram Extraction",
};

export default async function InstagramExtractionPage() {
  const data = await getInstagramExtractionDashboardData();

  return (
    <AppShell
      title="Instagram Extraction"
      description="Bulk public profile extraction progress and worker status"
    >
      <InstagramExtractionDashboard {...data} />
    </AppShell>
  );
}
