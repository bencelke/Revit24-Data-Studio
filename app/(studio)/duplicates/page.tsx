import type { Metadata } from "next";
import { AppShell } from "@/components/layout";
import { DuplicatesPageNav, DuplicatesDashboardClient } from "@/components/duplicates";
import {
  getDuplicatesDashboardData,
  listDuplicateMatches,
  statusFilterForPage,
} from "@/lib/services/duplicateResolutionService";

export const metadata: Metadata = {
  title: "Duplicate Resolution",
};

export default async function DuplicatesPage() {
  const [dashboard, list] = await Promise.all([
    getDuplicatesDashboardData(),
    listDuplicateMatches({ status: statusFilterForPage("pending") }),
  ]);

  return (
    <AppShell
      title="Duplicate Resolution Center"
      description="Review, compare, and resolve potential duplicate entities — human approval required"
    >
      <div className="space-y-6">
        <DuplicatesPageNav active="pending" />
        <DuplicatesDashboardClient
          {...dashboard}
          initialList={list}
          defaultStatus="pending"
        />
      </div>
    </AppShell>
  );
}
