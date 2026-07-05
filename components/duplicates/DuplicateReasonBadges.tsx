import { Badge } from "@/components/ui/badge";
import type { MatchReason } from "@/lib/types/duplicates";
import { getReasonLabel } from "@/lib/services/matchScoringService";

interface DuplicateReasonBadgesProps {
  reasons: MatchReason[];
}

export function DuplicateReasonBadges({ reasons }: DuplicateReasonBadgesProps) {
  if (reasons.length === 0) return <span className="text-xs text-muted-foreground">—</span>;

  return (
    <div className="flex flex-wrap gap-1">
      {reasons.map((reason) => (
        <Badge key={reason} variant="secondary" className="text-xs font-normal">
          {getReasonLabel(reason)}
        </Badge>
      ))}
    </div>
  );
}
