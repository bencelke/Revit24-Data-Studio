import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ImportDataMode } from "@/lib/types/instagram-imports";

interface DataModeBadgeProps {
  dataMode: ImportDataMode;
  firebaseConfigured?: boolean;
  className?: string;
}

export function DataModeBadge({
  dataMode,
  firebaseConfigured = false,
  className,
}: DataModeBadgeProps) {
  const isLive = dataMode === "firestore" && firebaseConfigured;

  return (
    <Badge
      variant="outline"
      className={cn(
        isLive
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          : "border-amber-500/30 bg-amber-500/10 text-amber-400",
        className,
      )}
    >
      {isLive ? "Live Firestore Data" : "Mock Data Mode"}
    </Badge>
  );
}

interface FirestoreStatusBannerProps {
  variant: "success" | "warning" | "error" | "info";
  title: string;
  description: string;
}

const bannerStyles = {
  success: "border-emerald-500/30 bg-emerald-500/5",
  warning: "border-amber-500/30 bg-amber-500/5",
  error: "border-red-500/30 bg-red-500/5",
  info: "border-border bg-card",
} as const;

export function FirestoreStatusBanner({
  variant,
  title,
  description,
}: FirestoreStatusBannerProps) {
  return (
    <div className={cn("rounded-md border p-4", bannerStyles[variant])}>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
