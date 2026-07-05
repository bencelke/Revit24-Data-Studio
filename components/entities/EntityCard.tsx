import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { NormalizedRecordDocument } from "@/lib/types/normalization";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { TagCloud } from "./TagCloud";
import { BrandBadges } from "./BrandBadges";

interface EntityCardProps {
  record: NormalizedRecordDocument;
}

export function EntityCard({ record }: EntityCardProps) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="truncate text-base font-semibold">{record.displayName}</CardTitle>
            <CardDescription>
              {record.username ? `@${record.username}` : record.entityType}
            </CardDescription>
          </div>
          <ConfidenceBadge score={record.confidenceScore} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{record.entityType}</Badge>
          <Badge variant="outline" className="capitalize">
            {record.status.replace("_", " ")}
          </Badge>
        </div>
        {record.vehicleBrands.length > 0 ? (
          <BrandBadges brands={record.vehicleBrands} />
        ) : null}
        {record.tags.length > 0 ? <TagCloud tags={record.tags.slice(0, 6)} /> : null}
        <Button
          variant="secondary"
          size="sm"
          nativeButton={false}
          render={<Link href={`/entities/${record.id}`} />}
        >
          View entity
        </Button>
      </CardContent>
    </Card>
  );
}
