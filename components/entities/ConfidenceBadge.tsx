import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getConfidenceLabel, getConfidenceVariant } from "@/lib/services/confidenceService";

interface ConfidenceBadgeProps {
  score: number;
  className?: string;
}

const variantStyles = {
  high: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  medium: "border-brand/30 bg-brand/10 text-brand",
  low: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  "very-low": "border-border text-muted-foreground",
};

export function ConfidenceBadge({ score, className }: ConfidenceBadgeProps) {
  const variant = getConfidenceVariant(score);
  return (
    <Badge variant="outline" className={cn("font-medium", variantStyles[variant], className)}>
      {score} — {getConfidenceLabel(score)}
    </Badge>
  );
}
