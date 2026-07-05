import type { DashboardData } from "@/lib/types";

const MOCK_DASHBOARD_DATA: DashboardData = {
  stats: [
    {
      id: "todays-imports",
      label: "Today's Imports",
      value: "128",
      change: "+12% from yesterday",
      trend: "up",
    },
    {
      id: "pending-review",
      label: "Pending Review",
      value: "47",
      change: "8 high priority",
      trend: "neutral",
    },
    {
      id: "approved-records",
      label: "Approved Records",
      value: "2,341",
      change: "+86 this week",
      trend: "up",
    },
    {
      id: "duplicates-found",
      label: "Duplicates Found",
      value: "19",
      change: "3 need resolution",
      trend: "down",
    },
    {
      id: "queue-status",
      label: "Queue Status",
      value: "Idle",
      change: "0 jobs running",
      trend: "neutral",
    },
  ],
  recentActivity: [
    {
      id: "1",
      action: "Import batch submitted",
      target: "Instagram profiles — Batch #284",
      actor: "collector@revit24.com",
      timestamp: "2 minutes ago",
      status: "success",
    },
    {
      id: "2",
      action: "Record approved",
      target: "Precision Auto Detailing",
      actor: "reviewer@revit24.com",
      timestamp: "14 minutes ago",
      status: "success",
    },
    {
      id: "3",
      action: "Duplicate flagged",
      target: "@midnight.motors",
      actor: "system",
      timestamp: "32 minutes ago",
      status: "warning",
    },
    {
      id: "4",
      action: "Review assigned",
      target: "SoCal Car Meet — March 2026",
      actor: "admin@revit24.com",
      timestamp: "1 hour ago",
      status: "pending",
    },
    {
      id: "5",
      action: "Import batch submitted",
      target: "Google Places — Wrap shops",
      actor: "collector@revit24.com",
      timestamp: "2 hours ago",
      status: "success",
    },
  ],
};

export function getDashboardData(): DashboardData {
  return MOCK_DASHBOARD_DATA;
}
