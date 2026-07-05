import type { Metadata } from "next";
import {
  Activity,
  CheckCircle2,
  Copy,
  ListTodo,
  Upload,
} from "lucide-react";
import { AppShell } from "@/components/layout";
import { StatCard, RecentActivity } from "@/components/dashboard";
import { getDashboardData } from "@/lib/services";

export const metadata: Metadata = {
  title: "Dashboard",
};

const statIcons = {
  "todays-imports": Upload,
  "pending-review": Activity,
  "approved-records": CheckCircle2,
  "duplicates-found": Copy,
  "queue-status": ListTodo,
} as const;

export default function DashboardPage() {
  const { stats, recentActivity } = getDashboardData();

  return (
    <AppShell
      title="Dashboard"
      description="Overview of imports, review pipeline, and queue health"
    >
      <div className="space-y-6">
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
