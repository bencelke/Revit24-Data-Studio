import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImportStatusBadge } from "./ImportStatusBadge";
import {
  formatImportDate,
  getImportSourceLabel,
  getImportTypeLabel,
} from "@/lib/services/importService";
import type { ImportJobDetail } from "@/lib/types/imports";

interface ImportJobHeaderProps {
  job: ImportJobDetail;
}

export function ImportJobHeader({ job }: ImportJobHeaderProps) {
  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        nativeButton={false}
        render={<Link href="/imports/history" />}
        className="gap-1.5 px-0 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to history
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold tracking-tight">{job.name}</h2>
            <ImportStatusBadge status={job.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {getImportTypeLabel(job.type)} · {getImportSourceLabel(job.source)}
          </p>
        </div>

        <div className="grid gap-2 text-sm sm:text-right">
          <p className="text-muted-foreground">
            Created by{" "}
            <span className="text-foreground">{job.createdBy}</span>
          </p>
          <p className="text-muted-foreground">
            {formatImportDate(job.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
