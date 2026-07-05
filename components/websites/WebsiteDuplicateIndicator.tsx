import { Badge } from "@/components/ui/badge";
import type { WebsiteDuplicateMatch } from "@/lib/types/websites";
import { cn } from "@/lib/utils";

const levelStyles: Record<WebsiteDuplicateMatch["confidenceLevel"], string> = {
  high: "border-red-500/30 bg-red-500/10 text-red-400",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  low: "border-border text-muted-foreground",
  possible: "border-border bg-muted text-muted-foreground",
};

interface WebsiteDuplicateIndicatorProps {
  match: WebsiteDuplicateMatch;
  className?: string;
}

export function WebsiteDuplicateIndicator({ match, className }: WebsiteDuplicateIndicatorProps) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", levelStyles[match.confidenceLevel], className)}
    >
      {match.confidenceLevel} match ({match.confidenceScore}) — {match.matchedName}
      <span className="ml-1 opacity-70">[{match.matchFields.join(", ")}]</span>
    </Badge>
  );
}
