import type { InstagramProfileDocument } from "@/lib/types/instagram-profiles";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface InstagramProfileStatsProps {
  profile: InstagramProfileDocument;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4 text-center">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

function formatCount(value: number | null): string {
  if (value == null) return "—";
  return value.toLocaleString();
}

export function InstagramProfileStats({ profile }: InstagramProfileStatsProps) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Public Stats</CardTitle>
        <CardDescription>Only counts visible on the public profile page</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Followers" value={formatCount(profile.followers)} />
          <Stat label="Following" value={formatCount(profile.following)} />
          <Stat label="Posts" value={formatCount(profile.posts)} />
        </div>
      </CardContent>
    </Card>
  );
}
