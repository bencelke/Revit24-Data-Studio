import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { InstagramProfileDocument } from "@/lib/types/instagram-profiles";
import { formatQueueDate } from "@/lib/services/queueService";

interface InstagramMetadataCardProps {
  profile: InstagramProfileDocument;
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <span className="w-36 shrink-0 text-muted-foreground">{label}</span>
      <span className="break-all text-foreground">{value ?? "—"}</span>
    </div>
  );
}

export function InstagramMetadataCard({ profile }: InstagramMetadataCardProps) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Extracted Metadata</CardTitle>
        <CardDescription>
          Public fields collected at {formatQueueDate(profile.extractedAt)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <Row label="Bio" value={profile.bio} />
        <Row label="Website" value={profile.website} />
        <Row label="Public Email" value={profile.publicEmail} />
        <Row label="Public Phone" value={profile.publicPhone} />
        <Row label="Business Category" value={profile.businessCategory} />
        <Row label="Profile URL" value={profile.profileUrl} />
        {profile.errorMessage ? (
          <Row label="Error" value={profile.errorMessage} />
        ) : null}
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={
              <Link href={profile.profileUrl} target="_blank" rel="noopener noreferrer" />
            }
          >
            <ExternalLink className="size-4" />
            View on Instagram
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
