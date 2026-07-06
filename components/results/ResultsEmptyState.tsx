"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ResultsEmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-border p-10 text-center">
      <p className="text-sm text-muted-foreground">
        No extracted profiles yet. Queue Instagram profiles, run the local worker, then return
        here to export JSON.
      </p>
      <Button className="mt-4" nativeButton={false} render={<Link href="/instagram-extractor" />}>
        Back to Instagram Extractor
      </Button>
    </div>
  );
}
