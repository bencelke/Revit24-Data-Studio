import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { WebsiteJobDocument } from "@/lib/types/websites";
import { formatImportDate } from "@/lib/services/importService";

interface DiscoveryJobCardProps {
  job: WebsiteJobDocument;
}

export function DiscoveryJobCard({ job }: DiscoveryJobCardProps) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold">
              {job.inputType === "domain" ? "Domain Import" : `${job.totalUrls} URL${job.totalUrls === 1 ? "" : "s"}`}
            </CardTitle>
            <CardDescription>{formatImportDate(job.createdAt)}</CardDescription>
          </div>
          <Badge variant="outline">{job.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span>{job.successfulUrls} successful</span>
          <span>·</span>
          <span>{job.failedUrls} failed</span>
          <span>·</span>
          <span>{job.processedUrls}/{job.totalUrls} processed</span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          nativeButton={false}
          render={<Link href={`/websites/results?jobId=${job.id}`} />}
        >
          View results
        </Button>
      </CardContent>
    </Card>
  );
}
