import {
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  type LucideIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DashboardStat } from "@/lib/types";

const trendIcons = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  neutral: Minus,
} as const;

const trendColors = {
  up: "text-brand",
  down: "text-muted-foreground",
  neutral: "text-muted-foreground",
} as const;

interface StatCardProps {
  stat: DashboardStat;
  icon?: LucideIcon;
}

export function StatCard({ stat, icon: Icon }: StatCardProps) {
  const TrendIcon = trendIcons[stat.trend];

  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription className="text-xs uppercase tracking-wide">
            {stat.label}
          </CardDescription>
          {Icon ? (
            <Icon className="size-4 text-muted-foreground" aria-hidden />
          ) : null}
        </div>
        <CardTitle className="text-2xl font-semibold tracking-tight">
          {stat.value}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <TrendIcon
            className={cn("size-3.5", trendColors[stat.trend])}
            aria-hidden
          />
          <span>{stat.change}</span>
        </div>
      </CardContent>
    </Card>
  );
}
