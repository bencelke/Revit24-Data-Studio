"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Check, Copy, GitMerge, Pencil, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataModeBadge } from "@/components/imports/DataModeBadge";
import { ReviewHeader } from "./ReviewHeader";
import { ReviewNotes } from "./ReviewNotes";
import { ReviewTimeline } from "./ReviewTimeline";
import { ApprovalDialog } from "./ApprovalDialog";
import { RejectDialog } from "./RejectDialog";
import { NeedsEditDialog } from "./NeedsEditDialog";
import { DuplicateDialog } from "./DuplicateDialog";
import type { ReviewRecordDetailData } from "@/lib/types/review";

interface ReviewDetailClientProps {
  initialData: ReviewRecordDetailData;
}

type DialogType = "approve" | "reject" | "needs_edit" | "duplicate" | null;

export function ReviewDetailClient({ initialData }: ReviewDetailClientProps) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [dialog, setDialog] = useState<DialogType>(null);
  const [loading, setLoading] = useState(false);
  const { record, history, permissions, dataMode, firebaseConfigured } = data;

  async function runAction(body: Record<string, unknown>) {
    setLoading(true);
    try {
      const response = await fetch(`/api/review/${record.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = (await response.json()) as { success: boolean; error?: string };

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Action failed.");
      }

      const refresh = await fetch(`/api/review/${record.id}`);
      const refreshed = (await refresh.json()) as ReviewRecordDetailData;
      setData(refreshed);
      setDialog(null);
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const canModerate = !permissions.readOnly;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/review" />}
          className="gap-1.5 px-0 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to review queue
        </Button>
        <DataModeBadge dataMode={dataMode} firebaseConfigured={firebaseConfigured} />
      </div>

      <ReviewHeader record={record} />

      {canModerate ? (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setDialog("approve")} disabled={loading}>
            <Check className="size-4" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setDialog("reject")}
            disabled={loading}
          >
            <X className="size-4" />
            Reject
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDialog("needs_edit")}
            disabled={loading}
          >
            <Pencil className="size-4" />
            Needs Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDialog("duplicate")}
            disabled={loading}
          >
            <Copy className="size-4" />
            Mark Duplicate
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => runAction({ action: "merge_later" })}
            disabled={loading}
          >
            <GitMerge className="size-4" />
            Merge Later
          </Button>
          {record.reviewStatus === "rejected" ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => runAction({ action: "reopen" })}
              disabled={loading}
            >
              <RotateCcw className="size-4" />
              Reopen
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border bg-card shadow-none">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Record Details</CardTitle>
            <CardDescription>Imported data awaiting moderation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <DetailRow label="Instagram URL" value={record.profileUrl} />
            <DetailRow label="Original Input" value={record.originalInput} />
            <DetailRow label="Import Job" value={record.jobName} />
            <DetailRow label="Validation" value={record.validationStatus} />
            {record.error ? <DetailRow label="Error" value={record.error} /> : null}
            {record.website ? <DetailRow label="Website" value={record.website} /> : null}
            {record.publicEmail ? (
              <DetailRow label="Public Email" value={record.publicEmail} />
            ) : null}
            {record.country ? <DetailRow label="Country" value={record.country} /> : null}
            {record.city ? <DetailRow label="City" value={record.city} /> : null}
            {record.description ? (
              <DetailRow label="Description" value={record.description} />
            ) : null}
            {record.tags.length > 0 ? (
              <DetailRow label="Tags" value={record.tags.join(", ")} />
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-none">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Metadata</CardTitle>
            <CardDescription>System fields and identifiers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <DetailRow label="Record ID" value={record.id} />
            <DetailRow label="Job ID" value={record.jobId} />
            <DetailRow label="Import Source" value={record.importSource} />
            <DetailRow label="Duplicate Of" value={record.duplicateOf} />
            <DetailRow label="Created" value={record.createdAt} />
            <DetailRow label="Updated" value={record.updatedAt} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ReviewNotes
          notes={record.notes}
          readOnly={!canModerate}
          onSaveNotes={
            canModerate
              ? async (message) => runAction({ action: "save_notes", notes: message })
              : undefined
          }
        />
        <ReviewTimeline history={history} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <PlaceholderSection
          title="AI Suggestions"
          description="Future phase — automated classification and enrichment suggestions."
        />
        <PlaceholderSection
          title="Duplicate Suggestions"
          description="Future phase — potential duplicate matches from merge engine."
        />
      </div>

      <ApprovalDialog
        open={dialog === "approve"}
        onCancel={() => setDialog(null)}
        onConfirm={(notes) => runAction({ action: "approve", notes })}
        loading={loading}
      />
      <RejectDialog
        open={dialog === "reject"}
        onCancel={() => setDialog(null)}
        onConfirm={(notes) => runAction({ action: "reject", notes })}
        loading={loading}
      />
      <NeedsEditDialog
        open={dialog === "needs_edit"}
        record={record}
        onCancel={() => setDialog(null)}
        onConfirm={(edits) => runAction({ action: "needs_edit", edits })}
        loading={loading}
      />
      <DuplicateDialog
        open={dialog === "duplicate"}
        onCancel={() => setDialog(null)}
        onConfirm={(notes) => runAction({ action: "mark_duplicate", notes })}
        loading={loading}
      />
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <span className="w-32 shrink-0 text-muted-foreground">{label}</span>
      <span className="break-all text-foreground">{value ?? "—"}</span>
    </div>
  );
}

function PlaceholderSection({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="border-dashed border-border bg-card/50 shadow-none">
      <CardHeader>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Coming in a future phase.</p>
      </CardContent>
    </Card>
  );
}
