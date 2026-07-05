import type { Metadata } from "next";
import { AppShell } from "@/components/layout";
import { DuplicatesPageNav, DuplicatesDashboardClient } from "@/components/duplicates";
import {
  getDuplicatesDashboardData,
  listDuplicateMatches,
} from "@/lib/services/duplicateResolutionService";

export const metadata: Metadata = {
  title: "Resolved Duplicates",
};

export default async function DuplicatesResolvedPage() {
  const [dashboard, list] = await Promise.all([
    getDuplicatesDashboardData(),
    listDuplicateMatches({ status: "resolved" }),
  ]);

  return (
    <AppShell
      title="Resolved Matches"
      description="Previously resolved duplicate matches"
    >
      <div className="space-y-6">
        <DuplicatesPageNav active="resolved" />
        <DuplicatesDashboardClient
          {...dashboard}
          initialList={list}
          defaultStatus="resolved"
        />
      </div>
    </AppShell>
  );
}
