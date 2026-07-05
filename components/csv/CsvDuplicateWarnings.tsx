import { Badge } from "@/components/ui/badge";
import type { CsvDuplicateMatch } from "@/lib/types/csv-import";

interface CsvDuplicateWarningsProps {
  matches: CsvDuplicateMatch[];
  compact?: boolean;
}

export function CsvDuplicateWarnings({ matches, compact }: CsvDuplicateWarningsProps) {
  if (matches.length === 0) return null;

  if (compact) {
    const top = matches[0];
    return (
      <span className="text-xs text-amber-400">
        Possible duplicate ({top.confidenceScore}) — {top.matchedName}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {matches.map((match) => (
        <Badge
          key={match.matchedId}
          variant="outline"
          className="border-amber-500/30 bg-amber-500/10 text-amber-400"
        >
          {match.confidenceScore}% — {match.matchedName} ({match.matchFields.join(", ")})
        </Badge>
      ))}
    </div>
  );
}
