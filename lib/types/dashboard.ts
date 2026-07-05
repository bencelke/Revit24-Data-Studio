export interface DashboardStat {
  id: string;
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
}

export interface ActivityItem {
  id: string;
  action: string;
  target: string;
  actor: string;
  timestamp: string;
  status: "success" | "pending" | "warning";
}

export interface DashboardData {
  stats: DashboardStat[];
  recentActivity: ActivityItem[];
}
