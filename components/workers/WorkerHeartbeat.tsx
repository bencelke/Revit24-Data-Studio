import { cn } from "@/lib/utils";
import { formatRelativeHeartbeat } from "@/lib/services/workerService";
import { isHeartbeatExpired } from "@/workers/runtime/heartbeat";
import { Activity } from "lucide-react";

interface WorkerHeartbeatProps {
  lastHeartbeat: string;
  className?: string;
}

export function WorkerHeartbeat({ lastHeartbeat, className }: WorkerHeartbeatProps) {
  const expired = isHeartbeatExpired(lastHeartbeat);

  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      <Activity
        className={cn(
          "size-4",
          expired ? "text-muted-foreground" : "text-emerald-400",
        )}
        aria-hidden
      />
      <span className={expired ? "text-muted-foreground" : "text-foreground"}>
        {expired ? "Offline" : "Live"} · {formatRelativeHeartbeat(lastHeartbeat)}
      </span>
    </div>
  );
}
