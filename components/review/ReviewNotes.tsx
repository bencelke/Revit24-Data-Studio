"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ReviewRecordNote } from "@/lib/types/review";
import { formatReviewDate } from "@/lib/services/reviewService";

interface ReviewNotesProps {
  notes: ReviewRecordNote[];
  onSaveNotes?: (message: string) => Promise<void>;
  readOnly?: boolean;
}

export function ReviewNotes({ notes, onSaveNotes, readOnly = false }: ReviewNotesProps) {
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!onSaveNotes || !message.trim()) return;
    setSaving(true);
    try {
      await onSaveNotes(message.trim());
      setMessage("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Review Notes</CardTitle>
        <CardDescription>Internal notes visible to reviewers only</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notes yet.</p>
        ) : (
          <ul className="space-y-3">
            {notes.map((note, index) => (
              <li
                key={`${note.timestamp}-${index}`}
                className="rounded-lg border border-border bg-muted/30 p-3"
              >
                <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{note.reviewer}</span>
                  <span>{formatReviewDate(note.timestamp)}</span>
                </div>
                <p className="text-sm text-foreground">{note.message}</p>
              </li>
            ))}
          </ul>
        )}

        {!readOnly && onSaveNotes ? (
          <div className="space-y-2">
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Add a review note..."
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <Button
              size="sm"
              disabled={!message.trim() || saving}
              onClick={handleSave}
            >
              {saving ? "Saving..." : "Save Notes"}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
