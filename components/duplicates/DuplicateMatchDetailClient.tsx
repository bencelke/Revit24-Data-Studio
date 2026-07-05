"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, Copy, GitMerge, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataModeBadge } from "@/components/imports/DataModeBadge";
import { DuplicateComparePanel } from "./DuplicateComparePanel";
import { DuplicateConfidenceBadge } from "./DuplicateConfidenceBadge";
import { DuplicateReasonBadges } from "./DuplicateReasonBadges";
import { MergeFieldSelector } from "./MergeFieldSelector";
import { MergePreviewCard } from "./MergePreviewCard";
import { MergeActionDialog } from "./MergeActionDialog";
import { MergeHistoryTimeline } from "./MergeHistoryTimeline";
import { buildMergePreview, getDefaultFieldSelections, updateFieldSelection } from "@/lib/services/mergeService";
import type { DuplicateMatchDetailData, MergeAction, MergeFieldKey, MergeFieldSelection, MergeFieldSelections } from "@/lib/types/duplicates";
import { getMatchStatusLabel } from "@/lib/services/matchScoringService";

interface DuplicateMatchDetailClientProps {
  initialData: DuplicateMatchDetailData;
}

export function DuplicateMatchDetailClient({ initialData }: DuplicateMatchDetailClientProps) {
  const router = useRouter();
  const { match, recordA, recordB, history, dataMode, firebaseConfigured } = initialData;
  const [selections, setSelections] = useState<MergeFieldSelections>(getDefaultFieldSelections());
  const [dialogAction, setDialogAction] = useState<MergeAction | null>(null);
  const [loading, setLoading] = useState(false);

  const preview = useMemo(
    () => buildMergePreview(recordA, recordB, selections),
    [recordA, recordB, selections],
  );

  function handleFieldChange(field: MergeFieldKey, selection: MergeFieldSelection) {
    setSelections((current) => updateFieldSelection(current, field, selection));
  }

  async function runAction(action: MergeAction, notes: string) {
    setLoading(true);
    try {
      const response = await fetch(`/api/duplicates/${match.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          notes,
          fieldSelections: action === "merge" ? selections : undefined,
        }),
      });
      if (response.ok) {
        setDialogAction(null);
        router.push("/duplicates");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  const isPending = match.status === "pending" || match.status === "needs_review";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/duplicates" />}
          className="gap-1.5 px-0 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to duplicates
        </Button>
        <DataModeBadge dataMode={dataMode} firebaseConfigured={firebaseConfigured} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <DuplicateConfidenceBadge level={match.confidence} score={match.confidenceScore} />
        <DuplicateReasonBadges reasons={match.reasons} />
        <span className="text-sm text-muted-foreground">{getMatchStatusLabel(match.status)}</span>
      </div>

      <DuplicateComparePanel recordA={recordA} recordB={recordB} />

      {isPending ? (
        <>
          <MergeFieldSelector selections={selections} onChange={handleFieldChange} />
          <MergePreviewCard preview={preview} />

          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setDialogAction("merge")} disabled={loading}>
              <GitMerge className="size-4" />
              Merge Records
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setDialogAction("mark_duplicate")} disabled={loading}>
              <Copy className="size-4" />
              Mark Duplicate
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setDialogAction("keep_separate")} disabled={loading}>
              Keep Separate
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setDialogAction("approve_both")} disabled={loading}>
              <Check className="size-4" />
              Approve Both
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDialogAction("ignore_match")} disabled={loading}>
              <X className="size-4" />
              Ignore Match
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDialogAction("needs_review")} disabled={loading}>
              <Eye className="size-4" />
              Needs Review
            </Button>
          </div>
        </>
      ) : null}

      <MergeHistoryTimeline history={history} />

      <MergeActionDialog
        open={dialogAction !== null}
        action={dialogAction}
        loading={loading}
        onConfirm={(notes) => {
          if (dialogAction) void runAction(dialogAction, notes);
        }}
        onCancel={() => setDialogAction(null)}
      />
    </div>
  );
}
