import type { Metadata } from "next";
import { AppShell } from "@/components/layout";
import { DuplicatesPageNav, DuplicatesDashboardClient } from "@/components/duplicates";
import {
  getDuplicatesDashboardData,
  listDuplicateMatches,
} from "@/lib/services/duplicateResolutionService";

export const metadata: Metadata = {
  title: "Ignored Duplicates",
};

export default async function DuplicatesIgnoredPage() {
  const [dashboard, list] = await Promise.all([
    getDuplicatesDashboardData(),
    listDuplicateMatches({ status: "ignored" }),
  ]);

  return (
    <AppShell
      title="Ignored Matches"
      description="Dismissed duplicate matches and false positives"
    >
      <div className="space-y-6">
        <DuplicatesPageNav active="ignored" />
        <DuplicatesDashboardClient
          {...dashboard}
          initialList={list}
          defaultStatus="ignored"
        />
      </div>
    </AppShell>
  );
}
