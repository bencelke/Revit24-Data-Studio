import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { InstagramProfileDocument } from "@/lib/types/instagram-profiles";

interface InstagramProfileCardProps {
  profile: InstagramProfileDocument;
}

export function InstagramProfileCard({ profile }: InstagramProfileCardProps) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Avatar className="size-12">
            {profile.profileImageUrl ? (
              <AvatarImage src={profile.profileImageUrl} alt={profile.username} />
            ) : null}
            <AvatarFallback className="bg-muted text-muted-foreground">
              {profile.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-base font-semibold">
              {profile.displayName ?? profile.username}
            </CardTitle>
            <CardDescription>@{profile.username}</CardDescription>
          </div>
          <Badge variant="outline" className="capitalize">
            {profile.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {profile.bio ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{profile.bio}</p>
        ) : null}
        <Button
          variant="secondary"
          size="sm"
          nativeButton={false}
          render={<Link href={`/profiles/${profile.username}`} />}
        >
          Review extraction
        </Button>
      </CardContent>
    </Card>
  );
}
