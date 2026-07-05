import { Badge } from "@/components/ui/badge";
import type { MatchConfidenceLevel } from "@/lib/types/normalization";
import { getConfidenceLabel } from "@/lib/services/matchScoringService";
import { cn } from "@/lib/utils";

const levelStyles: Record<MatchConfidenceLevel, string> = {
  high: "border-red-500/30 bg-red-500/10 text-red-400",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  low: "border-border text-muted-foreground",
  possible: "border-border bg-muted text-muted-foreground",
  none: "border-border bg-muted text-muted-foreground",
};

interface DuplicateConfidenceBadgeProps {
  level: MatchConfidenceLevel;
  score?: number;
  className?: string;
}

export function DuplicateConfidenceBadge({ level, score, className }: DuplicateConfidenceBadgeProps) {
  return (
    <Badge variant="outline" className={cn("font-medium", levelStyles[level], className)}>
      {getConfidenceLabel(level)}
      {score != null ? ` (${score})` : ""}
    </Badge>
  );
}
