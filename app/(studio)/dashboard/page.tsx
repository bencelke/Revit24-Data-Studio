import type { Metadata } from "next";
import {
  Activity,
  CheckCircle2,
  Database,
  Layers,
  ListTodo,
} from "lucide-react";
import { AppShell } from "@/components/layout";
import { StatCard, RecentActivity } from "@/components/dashboard";
import {
  DataModeBadge,
  FirestoreStatusBanner,
} from "@/components/imports";
import { getDashboardData } from "@/lib/services";

export const metadata: Metadata = {
  title: "Dashboard",
};

const statIcons = {
  "raw-imports": Layers,
  "extraction-jobs": ListTodo,
  "normalized-records": Database,
  "pending-review": Activity,
  approved: CheckCircle2,
} as const;

export default async function DashboardPage() {
  const { stats, recentActivity, dataMode, firebaseConfigured, warning } =
    await getDashboardData();

  return (
    <AppShell
      title="Dashboard"
      description="Overview of imports, extraction, normalization, and review pipeline"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <DataModeBadge
            dataMode={dataMode ?? "mock"}
            firebaseConfigured={firebaseConfigured ?? false}
          />
        </div>

        {warning ? (
          <FirestoreStatusBanner
            variant="warning"
            title="Mock Mode"
            description={warning}
          />
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          {stats.map((stat) => (
            <StatCard
              key={stat.id}
              stat={stat}
              icon={statIcons[stat.id as keyof typeof statIcons]}
            />
          ))}
        </div>

        <RecentActivity items={recentActivity} />
      </div>
    </AppShell>
  );
}
