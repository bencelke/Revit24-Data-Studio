"use client";

import { Button } from "@/components/ui/button";

const EXAMPLE_INPUT = `revit24official
@precision_tuning
https://www.instagram.com/midnight.wrap.studio/
instagram.com/velocity_photo`;

interface InstagramExtractorFormProps {
  value: string;
  onChange: (value: string) => void;
  onPreview: () => void;
  onCreateJob: () => void;
  onClear: () => void;
  isQueueing?: boolean;
  canCreateJob?: boolean;
}

export function InstagramExtractorForm({
  value,
  onChange,
  onPreview,
  onCreateJob,
  onClear,
  isQueueing,
  canCreateJob,
}: InstagramExtractorFormProps) {
  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Instagram profile links</label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste usernames or profile URLs — one per line"
          className="min-h-[220px] w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Accepted: username, @username, instagram.com/username, or full profile URLs
        </p>
        <pre className="rounded-md border border-dashed border-border bg-muted/20 p-3 text-xs text-muted-foreground">
          {EXAMPLE_INPUT}
        </pre>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={onPreview} disabled={!value.trim()}>
          Preview Links
        </Button>
        <Button type="button" onClick={onCreateJob} disabled={!canCreateJob || isQueueing}>
          {isQueueing ? "Queueing..." : "Create Extraction Job"}
        </Button>
        <Button type="button" variant="outline" onClick={onClear}>
          Clear
        </Button>
      </div>
    </div>
  );
}
