import { Badge } from "@/components/ui/badge";
import type { PlacesDuplicateMatch } from "@/lib/types/google-places";
import { cn } from "@/lib/utils";

const levelStyles: Record<PlacesDuplicateMatch["confidenceLevel"], string> = {
  high: "border-red-500/30 bg-red-500/10 text-red-400",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  low: "border-border text-muted-foreground",
  possible: "border-border bg-muted text-muted-foreground",
};

interface DuplicateIndicatorProps {
  match: PlacesDuplicateMatch;
  className?: string;
}

export function DuplicateIndicator({ match, className }: DuplicateIndicatorProps) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", levelStyles[match.confidenceLevel], className)}
    >
      {match.confidenceLevel} match ({match.confidenceScore}) — {match.matchedName}
    </Badge>
  );
}
