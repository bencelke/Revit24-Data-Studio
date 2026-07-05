import Link from "next/link";
import { Globe } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { WebsiteRawDocument } from "@/lib/types/websites";

interface WebsiteCardProps {
  website: WebsiteRawDocument;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  hasDuplicate?: boolean;
}

export function WebsiteCard({ website, selected, onToggleSelect, hasDuplicate }: WebsiteCardProps) {
  const socialCount = Object.values(website.socialLinks).filter(Boolean).length;

  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted/30">
              {website.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={website.logoUrl} alt="" className="size-8 rounded object-contain" />
              ) : (
                <Globe className="size-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <CardTitle className="text-base font-semibold">{website.title}</CardTitle>
              <CardDescription>
                {[website.city, website.country].filter(Boolean).join(", ") || website.domain}
              </CardDescription>
            </div>
          </div>
          {onToggleSelect ? (
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggleSelect(website.id)}
              className="mt-1 size-4 accent-brand"
            />
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {website.detectedBusinessType ? (
            <Badge variant="secondary">{website.detectedBusinessType}</Badge>
          ) : null}
          <Badge variant="outline">{website.status}</Badge>
          {hasDuplicate ? (
            <Badge variant="outline" className="border-amber-500/30 text-amber-400">
              Potential Duplicate
            </Badge>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>{website.publicEmails.length} emails</span>
          <span>{website.publicPhones.length} phones</span>
          <span>{socialCount} social links</span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          nativeButton={false}
          render={<Link href={`/websites/${website.id}`} />}
        >
          View details
        </Button>
      </CardContent>
    </Card>
  );
}
