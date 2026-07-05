"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EXAMPLE_INPUT = `https://www.instagram.com/midnight.motors/
@precision.autodetailing
instagram.com/stuttgart.tuning
jdm.culture.munich`;

interface InstagramBulkInputProps {
  value: string;
  onChange: (value: string) => void;
  onPreview: () => void;
  onCreateJob: () => void;
  isPreviewReady: boolean;
  isCreating?: boolean;
  disabled?: boolean;
}

export function InstagramBulkInput({
  value,
  onChange,
  onPreview,
  onCreateJob,
  isPreviewReady,
  isCreating = false,
  disabled = false,
}: InstagramBulkInputProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="instagram-bulk-input"
          className="text-sm font-medium text-foreground"
        >
          Instagram profile links or usernames
        </label>
        <textarea
          id="instagram-bulk-input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          placeholder="Paste one profile URL or username per line..."
          rows={14}
          className={cn(
            "w-full rounded-lg border border-input bg-transparent px-3 py-2.5 font-mono text-sm transition-colors outline-none",
            "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
          )}
        />
        <p className="text-sm text-muted-foreground">
          Accepted formats:{" "}
          <span className="font-mono text-xs">
            instagram.com/username
          </span>
          ,{" "}
          <span className="font-mono text-xs">
            https://www.instagram.com/username/
          </span>
          ,{" "}
          <span className="font-mono text-xs">@username</span>, or{" "}
          <span className="font-mono text-xs">username</span>. Only public
          profile links — post, reel, story, explore, and hashtag URLs are
          rejected.
        </p>
      </div>

      <div className="rounded-md border border-border bg-background/50 p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Example input
        </p>
        <pre className="overflow-x-auto font-mono text-xs text-muted-foreground">
          {EXAMPLE_INPUT}
        </pre>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onPreview}
          disabled={disabled || !value.trim()}
        >
          Preview Import
        </Button>
        <Button
          type="button"
          onClick={onCreateJob}
          disabled={disabled || !isPreviewReady || isCreating}
        >
          {isCreating ? "Creating..." : "Create Import Job"}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Only public metadata will be collected in future worker phases. No login
        automation, hidden emails, or private profile access.
      </p>
    </div>
  );
}
