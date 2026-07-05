import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getDiscoveryPlatformLabel,
  getDiscoveryQueryTypeLabel,
  getDiscoveryStatusLabel,
} from "@/lib/services/instagramProfileImportService";
import type { DiscoveryTarget } from "@/lib/types/instagram-imports";
import { cn } from "@/lib/utils";

const statusStyles = {
  planned: "border-border text-muted-foreground",
  researching: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  ready: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  archived: "border-border bg-muted text-muted-foreground",
} as const;

interface DiscoveryTargetCardProps {
  target: DiscoveryTarget;
}

export function DiscoveryTargetCard({ target }: DiscoveryTargetCardProps) {
  return (
    <Card className="flex flex-col border-border bg-card shadow-none">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base font-semibold">{target.name}</CardTitle>
          <Badge
            variant="outline"
            className={cn("shrink-0", statusStyles[target.status])}
          >
            {getDiscoveryStatusLabel(target.status)}
          </Badge>
        </div>
        <CardDescription className="font-mono text-xs">
          {target.query}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>{getDiscoveryPlatformLabel(target.platform)}</span>
          <span>·</span>
          <span>{getDiscoveryQueryTypeLabel(target.queryType)}</span>
          {target.country ? (
            <>
              <span>·</span>
              <span>{target.country}</span>
            </>
          ) : null}
          {target.city ? (
            <>
              <span>·</span>
              <span>{target.city}</span>
            </>
          ) : null}
        </div>

        {target.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {target.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px]">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="mt-auto flex flex-wrap gap-2">
        <Button variant="ghost" size="sm" disabled>
          Start Later
        </Button>
        <Button variant="ghost" size="sm" disabled>
          View Notes
        </Button>
      </CardFooter>
    </Card>
  );
}
