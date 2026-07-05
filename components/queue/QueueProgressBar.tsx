import { cn } from "@/lib/utils";

interface QueueProgressBarProps {
  percent: number;
  label?: string;
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

export function QueueProgressBar({
  percent,
  label,
  showLabel = true,
  animated = true,
  className,
}: QueueProgressBarProps) {
  const safePercent = Math.min(100, Math.max(0, percent));

  return (
    <div className={cn("space-y-1", className)}>
      {showLabel ? (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{label ?? "Progress"}</span>
          <span className="font-medium text-foreground">{safePercent}%</span>
        </div>
      ) : null}
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full bg-brand transition-all duration-500 ease-out",
            animated && safePercent > 0 && safePercent < 100 && "animate-pulse",
          )}
          style={{ width: `${safePercent}%` }}
          role="progressbar"
          aria-valuenow={safePercent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
