"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { MergeAction } from "@/lib/types/duplicates";

interface MergeActionDialogProps {
  open: boolean;
  action: MergeAction | null;
  loading?: boolean;
  onConfirm: (notes: string) => void | Promise<void>;
  onCancel: () => void;
}

const ACTION_CONFIG: Record<
  MergeAction,
  { title: string; description: string; confirmLabel: string; destructive?: boolean }
> = {
  merge: {
    title: "Merge Records",
    description: "Create a canonical record from selected fields. Original records are preserved and marked merged/duplicate.",
    confirmLabel: "Merge Records",
  },
  mark_duplicate: {
    title: "Mark Duplicate",
    description: "Mark Record B as a duplicate of Record A. No data is deleted.",
    confirmLabel: "Mark Duplicate",
  },
  keep_separate: {
    title: "Keep Separate",
    description: "Confirm these are distinct entities. Match will be resolved.",
    confirmLabel: "Keep Separate",
  },
  ignore_match: {
    title: "Ignore Match",
    description: "Dismiss this match as a false positive. It can be reviewed again later.",
    confirmLabel: "Ignore Match",
  },
  approve_both: {
    title: "Approve Both",
    description: "Approve both records as separate valid entities.",
    confirmLabel: "Approve Both",
  },
  needs_review: {
    title: "Needs Review",
    description: "Flag this match for additional review by another team member.",
    confirmLabel: "Flag for Review",
  },
};

export function MergeActionDialog({
  open,
  action,
  loading,
  onConfirm,
  onCancel,
}: MergeActionDialogProps) {
  if (!open || !action) return null;

  const config = ACTION_CONFIG[action];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await onConfirm(String(formData.get("notes") ?? ""));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close dialog"
        onClick={onCancel}
      />
      <Card className="relative z-10 w-full max-w-md border-border bg-card shadow-lg">
        <CardHeader>
          <CardTitle className="text-base font-semibold">{config.title}</CardTitle>
          <CardDescription>{config.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="merge-action-notes" className="text-sm font-medium">
                Notes (optional)
              </label>
              <textarea
                id="merge-action-notes"
                name="notes"
                rows={3}
                placeholder="Add resolution notes for the audit trail..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" variant={config.destructive ? "destructive" : "default"} disabled={loading}>
                {loading ? "Processing..." : config.confirmLabel}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
