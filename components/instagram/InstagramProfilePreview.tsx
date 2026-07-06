import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { InstagramPublicProfileMetadata } from "@/workers/instagram/instagramPublicProfileTypes";

interface InstagramProfilePreviewProps {
  profile: InstagramPublicProfileMetadata;
  rawSummary?: Record<string, unknown> | null;
}

export function InstagramProfilePreview({ profile, rawSummary }: InstagramProfilePreviewProps) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader>
        <div className="flex items-start gap-3">
          <Avatar className="size-14">
            {profile.profileImageUrl ? (
              <AvatarImage src={profile.profileImageUrl} alt={profile.username} />
            ) : null}
            <AvatarFallback className="bg-muted text-muted-foreground">
              {profile.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg font-semibold">
              {profile.displayName ?? profile.username}
            </CardTitle>
            <CardDescription>@{profile.username}</CardDescription>
            <div className="mt-2 flex flex-wrap gap-2">
              {profile.verified ? (
                <Badge variant="outline" className="border-orange-500/30 text-orange-400">
                  Verified
                </Badge>
              ) : null}
              {profile.businessCategory ? (
                <Badge variant="outline">{profile.businessCategory}</Badge>
              ) : null}
              <Badge variant="outline" className="capitalize">
                {profile.status}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {profile.bio ? <p className="text-muted-foreground">{profile.bio}</p> : null}

        <dl className="grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Profile URL</dt>
            <dd className="truncate">{profile.profileUrl}</dd>
          </div>
          {profile.website ? (
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Website</dt>
              <dd className="truncate">{profile.website}</dd>
            </div>
          ) : null}
          {profile.publicEmail ? (
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Public Email</dt>
              <dd>{profile.publicEmail}</dd>
            </div>
          ) : null}
          {profile.publicPhone ? (
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Public Phone</dt>
              <dd>{profile.publicPhone}</dd>
            </div>
          ) : null}
          {profile.followers != null ? (
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Followers</dt>
              <dd>{profile.followers.toLocaleString()}</dd>
            </div>
          ) : null}
          {profile.following != null ? (
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Following</dt>
              <dd>{profile.following.toLocaleString()}</dd>
            </div>
          ) : null}
          {profile.posts != null ? (
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Posts</dt>
              <dd>{profile.posts.toLocaleString()}</dd>
            </div>
          ) : null}
        </dl>

        {rawSummary ? (
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Raw Safe Metadata
            </p>
            <pre className="overflow-x-auto text-xs text-muted-foreground">
              {JSON.stringify(rawSummary, null, 2)}
            </pre>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
