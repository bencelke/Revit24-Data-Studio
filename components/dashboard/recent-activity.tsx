import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ActivityItem } from "@/lib/types";

const statusVariants = {
  success: "secondary",
  pending: "outline",
  warning: "outline",
} as const;

interface RecentActivityProps {
  items: ActivityItem[];
}

export function RecentActivity({ items }: RecentActivityProps) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
        <CardDescription>
          Latest actions across imports, review, and queue
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.id}>
              <div className="flex items-start justify-between gap-4 px-6 py-4">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {item.action}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {item.target}
                  </p>
                  <p className="text-xs text-muted-foreground/80">
                    {item.actor} · {item.timestamp}
                  </p>
                </div>
                <Badge
                  variant={statusVariants[item.status]}
                  className="shrink-0 capitalize"
                >
                  {item.status}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
