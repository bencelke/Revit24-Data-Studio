import { CheckCircle2, Circle, XCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatImportDate } from "@/lib/services/importService";
import type { ImportTimelineEvent } from "@/lib/types/imports";

interface ImportTimelineProps {
  events: ImportTimelineEvent[];
}

const statusIcons = {
  completed: CheckCircle2,
  current: Circle,
  upcoming: Circle,
  failed: XCircle,
} as const;

const statusColors = {
  completed: "text-emerald-400",
  current: "text-brand",
  upcoming: "text-muted-foreground",
  failed: "text-red-400",
} as const;

export function ImportTimeline({ events }: ImportTimelineProps) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Timeline</CardTitle>
        <CardDescription>Import job lifecycle events</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="space-y-4">
          {events.map((event, index) => {
            const Icon = statusIcons[event.status];

            return (
              <li key={event.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <Icon
                    className={cn("size-4 shrink-0", statusColors[event.status])}
                    aria-hidden
                  />
                  {index < events.length - 1 ? (
                    <div className="mt-1 w-px flex-1 bg-border" />
                  ) : null}
                </div>
                <div className="min-w-0 pb-4">
                  <p className="text-sm font-medium text-foreground">
                    {event.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {event.timestamp
                      ? formatImportDate(event.timestamp)
                      : "Not started"}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
