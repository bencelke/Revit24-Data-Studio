import type { QueueTimelineEvent } from "@/lib/types/queue";
import { QueueStatusBadge } from "./QueueStatusBadge";
import { formatQueueDate } from "@/lib/services/queueService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface QueueTimelineProps {
  events: QueueTimelineEvent[];
}

export function QueueTimeline({ events }: QueueTimelineProps) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Queue Timeline</CardTitle>
        <CardDescription>Job lifecycle events — GitHub Actions style</CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No timeline events yet.</p>
        ) : (
          <ol className="relative space-y-4 border-l border-border pl-4">
            {events.map((event) => (
              <li key={event.id} className="relative">
                <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-brand" />
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <QueueStatusBadge status={event.status} />
                    <span className="text-xs text-muted-foreground">
                      {formatQueueDate(event.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{event.message}</p>
                  <p className="text-xs text-muted-foreground">by {event.actor}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
