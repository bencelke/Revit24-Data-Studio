"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataModeBadge } from "@/components/imports/DataModeBadge";
import { EntityHeader } from "./EntityHeader";
import { EntitySummary } from "./EntitySummary";
import { SocialLinksCard } from "./SocialLinksCard";
import { TagCloud } from "./TagCloud";
import { BrandBadges } from "./BrandBadges";
import { PotentialMatches } from "./PotentialMatches";
import { formatQueueDate } from "@/lib/services/queueService";
import type { EntityDetailData } from "@/lib/types/normalization";

interface EntityDetailClientProps {
  initialData: EntityDetailData;
}

export function EntityDetailClient({ initialData }: EntityDetailClientProps) {
  const { record, matches, logs, dataMode, firebaseConfigured } = initialData;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/entities" />}
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to entities
        </Button>
        <DataModeBadge dataMode={dataMode} firebaseConfigured={firebaseConfigured} />
      </div>

      <EntityHeader record={record} />

      <div className="grid gap-6 lg:grid-cols-2">
        <EntitySummary record={record} />
        <SocialLinksCard socialLinks={record.socialLinks} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card shadow-none">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Detected Entity Type</CardTitle>
            <CardDescription>Rule-based classification (no AI)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg font-medium">{record.entityType}</p>
            {record.specialties.length > 0 ? (
              <TagCloud tags={record.specialties} label="Specialties" />
            ) : null}
            {record.vehicleBrands.length > 0 ? (
              <BrandBadges brands={record.vehicleBrands} label="Detected Brands" />
            ) : null}
            {record.tags.length > 0 ? <TagCloud tags={record.tags} /> : null}
          </CardContent>
        </Card>

        <PotentialMatches matches={matches} />
      </div>

      {logs.length > 0 ? (
        <Card className="border-border bg-card shadow-none">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Normalization Log</CardTitle>
            <CardDescription>Pipeline events for this entity</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {logs.map((log) => (
                <li key={log.id} className="flex flex-col gap-0.5 border-b border-border pb-2 last:border-0">
                  <span className="font-medium">{log.event}</span>
                  <span className="text-muted-foreground">{log.message}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatQueueDate(log.timestamp)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
