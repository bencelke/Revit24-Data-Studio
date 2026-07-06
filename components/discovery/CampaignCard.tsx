"use client";

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
import type { DiscoveryCampaignDocument } from "@/lib/types/discovery-engine";
import {
  formatDiscoveryProvider,
  formatEntityType,
} from "@/lib/services/keywordGenerationService";

interface CampaignCardProps {
  campaign: DiscoveryCampaignDocument;
  showRun?: boolean;
  onRun?: (campaignId: string) => void;
  running?: boolean;
}

export function CampaignCard({ campaign, showRun, onRun, running }: CampaignCardProps) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="truncate text-base font-semibold">{campaign.name}</CardTitle>
            <CardDescription className="line-clamp-2">
              {campaign.description ?? "No description"}
            </CardDescription>
          </div>
          <Badge variant="outline" className="capitalize shrink-0">
            {campaign.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>{formatDiscoveryProvider(campaign.provider)}</span>
          {campaign.city ? <span>· {campaign.city}</span> : null}
          {campaign.country ? <span>· {campaign.country}</span> : null}
        </div>
        <div className="flex flex-wrap gap-1">
          {campaign.entityTypes.slice(0, 3).map((type) => (
            <Badge key={type} variant="secondary" className="text-xs">
              {formatEntityType(type)}
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            nativeButton={false}
            render={<Link href={`/discovery/campaigns/${campaign.id}`} />}
          >
            View
          </Button>
          {showRun && onRun ? (
            <Button
              size="sm"
              disabled={running}
              onClick={() => onRun(campaign.id)}
            >
              {running ? "Running…" : "Run Discovery"}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
