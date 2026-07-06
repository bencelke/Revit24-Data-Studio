"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FirestoreStatusBanner } from "@/components/imports/DataModeBadge";
import type { InstagramTestExtractionPageData } from "@/lib/services/instagramTestExtractionService";
import type { InstagramTestExtractionResult } from "@/lib/services/instagramTestExtractionService";
import { InstagramProfilePreview } from "./InstagramProfilePreview";
import { InstagramExtractionErrorCard } from "./InstagramExtractionErrorCard";
import { Loader2 } from "lucide-react";

type InstagramExtractionTestProps = InstagramTestExtractionPageData;

export function InstagramExtractionTest({
  enabled,
  mockMode,
  config,
}: InstagramExtractionTestProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InstagramTestExtractionResult | null>(null);

  async function handleRunTest(forceMock = false) {
    if (!input.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/instagram/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim(), forceMock }),
      });

      const data = (await response.json()) as InstagramTestExtractionResult | { error: string };
      if ("error" in data && !("success" in data)) {
        setResult({
          success: false,
          data: null,
          error: { code: "unknown_error", message: data.error, retryable: false },
          durationMs: 0,
          workerVersion: "0.0.0",
          attempts: 0,
          rawSummary: null,
        });
      } else {
        setResult(data as InstagramTestExtractionResult);
      }
    } catch (error) {
      setResult({
        success: false,
        data: null,
        error: {
          code: "unknown_error",
          message: error instanceof Error ? error.message : "Test extraction failed.",
          retryable: false,
        },
        durationMs: 0,
        workerVersion: "0.0.0",
        attempts: 0,
        rawSummary: null,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {!enabled ? (
        <FirestoreStatusBanner
          variant="warning"
          title="Instagram Extraction Disabled"
          description="Set ENABLE_INSTAGRAM_EXTRACTION=true in your environment to enable live extraction. Mock data is available for UI testing."
        />
      ) : mockMode ? (
        <FirestoreStatusBanner
          variant="warning"
          title="Mock Extraction Mode"
          description="INSTAGRAM_EXTRACTION_MODE=mock is active. Live fetches are disabled."
        />
      ) : null}

      <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        <p>Delay: {config.delayMs}ms · Timeout: {config.timeoutMs}ms · Max retries: {config.maxRetries}</p>
        <p className="mt-1">Only publicly visible metadata is collected. No login, no private content.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Username or profile URL (e.g. @bmw or https://instagram.com/bmw)"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={loading}
        />
        <Button
          onClick={() => void handleRunTest(!enabled)}
          disabled={loading || !input.trim()}
          className="shrink-0"
        >
          {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Run Test Extraction
        </Button>
      </div>

      {result ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Completed in {result.durationMs}ms · {result.attempts} attempt(s) · v{result.workerVersion}
          </p>
          {result.success && result.data ? (
            <InstagramProfilePreview profile={result.data} rawSummary={result.rawSummary} />
          ) : result.error ? (
            <InstagramExtractionErrorCard error={result.error} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
