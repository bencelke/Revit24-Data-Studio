import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { EntityMatchDocument } from "@/lib/types/normalization";
import { getMatchLevelLabel } from "@/lib/services/entityMatchingService";
import { cn } from "@/lib/utils";

interface PotentialMatchesProps {
  matches: EntityMatchDocument[];
}

const levelStyles: Record<EntityMatchDocument["confidenceLevel"], string> = {
  high: "border-red-500/30 bg-red-500/10 text-red-400",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  low: "border-border text-muted-foreground",
  possible: "border-border bg-muted text-muted-foreground",
  none: "border-border text-muted-foreground",
};

export function PotentialMatches({ matches }: PotentialMatchesProps) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Potential Matches</CardTitle>
        <CardDescription>Duplicate detection only — no merge performed</CardDescription>
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
          <p className="text-sm text-muted-foreground">No potential duplicates detected.</p>
        ) : (
          <ul className="space-y-3">
            {matches.map((match) => (
              <li
                key={match.id}
                className="flex flex-col gap-2 rounded-lg border border-border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{match.matchedDisplayName}</p>
                  <p className="text-xs text-muted-foreground">
                    Matched on: {match.matchFields.join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn("font-medium", levelStyles[match.confidenceLevel])}
                  >
                    {getMatchLevelLabel(match.confidenceLevel)} ({match.confidenceScore})
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    nativeButton={false}
                    render={<Link href={`/entities/${match.matchedRecordId}`} />}
                  >
                    View
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
