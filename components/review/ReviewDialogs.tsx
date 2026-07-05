"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ReviewDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: "default" | "destructive";
  notesLabel?: string;
  notesRequired?: boolean;
  onConfirm: (notes: string) => void | Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function ReviewDialog({
  open,
  title,
  description,
  confirmLabel,
  confirmVariant = "default",
  notesLabel = "Notes (optional)",
  notesRequired = false,
  onConfirm,
  onCancel,
  loading = false,
}: ReviewDialogProps) {
  if (!open) return null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const notes = String(formData.get("notes") ?? "");
    if (notesRequired && !notes.trim()) return;
    await onConfirm(notes);
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
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="review-dialog-notes" className="text-sm font-medium">
                {notesLabel}
              </label>
              <textarea
                id="review-dialog-notes"
                name="notes"
                rows={3}
                required={notesRequired}
                placeholder="Add context for this action..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant={confirmVariant === "destructive" ? "destructive" : "default"}
                disabled={loading}
              >
                {loading ? "Processing..." : confirmLabel}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export function ApprovalDialog(
  props: Omit<ReviewDialogProps, "title" | "description" | "confirmLabel">,
) {
  return (
    <ReviewDialog
      {...props}
      title="Approve Record"
      description="This record will be copied to approved_records and become eligible for ShiftIt."
      confirmLabel="Approve"
    />
  );
}

export function RejectDialog(
  props: Omit<ReviewDialogProps, "title" | "description" | "confirmLabel" | "confirmVariant">,
) {
  return (
    <ReviewDialog
      {...props}
      title="Reject Record"
      description="The record will be marked as rejected. It can be reopened later."
      confirmLabel="Reject"
      confirmVariant="destructive"
      notesLabel="Rejection reason"
    />
  );
}

export function DuplicateDialog(
  props: Omit<ReviewDialogProps, "title" | "description" | "confirmLabel">,
) {
  return (
    <ReviewDialog
      {...props}
      title="Mark as Duplicate"
      description="This record will be flagged as a duplicate and excluded from approval."
      confirmLabel="Mark Duplicate"
    />
  );
}
