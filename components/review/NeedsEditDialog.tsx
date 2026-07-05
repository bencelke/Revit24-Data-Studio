"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { NeedsEditPayload, ReviewRecordView } from "@/lib/types/review";

interface NeedsEditDialogProps {
  open: boolean;
  record: ReviewRecordView;
  onConfirm: (edits: NeedsEditPayload) => void | Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function NeedsEditDialog({
  open,
  record,
  onConfirm,
  onCancel,
  loading = false,
}: NeedsEditDialogProps) {
  const [edits, setEdits] = useState<NeedsEditPayload>({
    displayName: record.displayName,
    username: record.username,
    website: record.website,
    publicEmail: record.publicEmail,
    tags: record.tags,
    country: record.country,
    city: record.city,
    description: record.description,
    notes: "",
  });

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onConfirm({
      ...edits,
      tags: edits.tags ?? [],
    });
  }

  function updateField<K extends keyof NeedsEditPayload>(key: K, value: NeedsEditPayload[K]) {
    setEdits((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close dialog"
        onClick={onCancel}
      />
      <Card className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto border-border bg-card shadow-lg">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Needs Edit</CardTitle>
          <CardDescription>
            Update record fields before sending back for correction. No scraping.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Field
              label="Display Name"
              value={edits.displayName ?? ""}
              onChange={(value) => updateField("displayName", value || null)}
            />
            <Field
              label="Username"
              value={edits.username ?? ""}
              onChange={(value) => updateField("username", value || null)}
            />
            <Field
              label="Website"
              value={edits.website ?? ""}
              onChange={(value) => updateField("website", value || null)}
            />
            <Field
              label="Public Email"
              value={edits.publicEmail ?? ""}
              onChange={(value) => updateField("publicEmail", value || null)}
            />
            <Field
              label="Tags (comma-separated)"
              value={(edits.tags ?? []).join(", ")}
              onChange={(value) =>
                updateField(
                  "tags",
                  value
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean),
                )
              }
            />
            <Field
              label="Country"
              value={edits.country ?? ""}
              onChange={(value) => updateField("country", value || null)}
            />
            <Field
              label="City"
              value={edits.city ?? ""}
              onChange={(value) => updateField("city", value || null)}
            />
            <div className="space-y-2">
              <label htmlFor="needs-edit-description" className="text-sm font-medium">
                Description
              </label>
              <textarea
                id="needs-edit-description"
                value={edits.description ?? ""}
                onChange={(event) =>
                  updateField("description", event.target.value || null)
                }
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="needs-edit-notes" className="text-sm font-medium">
                Notes for reviewer
              </label>
              <textarea
                id="needs-edit-notes"
                value={edits.notes ?? ""}
                onChange={(event) => updateField("notes", event.target.value || null)}
                rows={2}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save & Mark Needs Edit"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
