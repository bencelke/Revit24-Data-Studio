import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { InstagramProfileDocument } from "@/lib/types/instagram-profiles";

const statusStyles: Record<InstagramProfileDocument["status"], string> = {
  pending: "border-border text-muted-foreground",
  completed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  failed: "border-red-500/30 bg-red-500/10 text-red-400",
  private: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  not_found: "border-border bg-muted text-muted-foreground",
};

interface InstagramProfileHeaderProps {
  profile: InstagramProfileDocument;
}

export function InstagramProfileHeader({ profile }: InstagramProfileHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold tracking-tight">
            {profile.displayName ?? `@${profile.username}`}
          </h2>
          {profile.verified ? (
            <Badge variant="outline" className="border-blue-500/30 text-blue-400">
              Verified
            </Badge>
          ) : null}
          <Badge variant="outline" className={cn("font-medium capitalize", statusStyles[profile.status])}>
            {profile.status.replace("_", " ")}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">@{profile.username}</p>
      </div>
      <div className="text-sm text-muted-foreground sm:text-right">
        <p>Worker v{profile.workerVersion}</p>
        <p>{profile.extractionDurationMs}ms extraction</p>
      </div>
    </div>
  );
}
