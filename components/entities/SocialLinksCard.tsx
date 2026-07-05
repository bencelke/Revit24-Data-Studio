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
import type { SocialLinks } from "@/lib/types/normalization";

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  website: "Website",
  discord: "Discord",
  telegram: "Telegram",
};

interface SocialLinksCardProps {
  socialLinks: SocialLinks;
}

export function SocialLinksCard({ socialLinks }: SocialLinksCardProps) {
  const entries = Object.entries(socialLinks).filter(([, url]) => url);

  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Social Links</CardTitle>
        <CardDescription>Normalized social presence</CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No social links detected.</p>
        ) : (
          <ul className="space-y-2">
            {entries.map(([platform, url]) => (
              <li key={platform} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-muted-foreground">
                  {PLATFORM_LABELS[platform] ?? platform}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  nativeButton={false}
                  render={
                    <Link href={url!} target="_blank" rel="noopener noreferrer" />
                  }
                >
                  <ExternalLink className="size-4" />
                  Open
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
