import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout";
import { ImportPageNav } from "@/components/imports";
import { InstagramBulkImportClient } from "@/components/imports/InstagramBulkImportClient";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Instagram Profile Import",
};

export default function InstagramBulkImportPage() {
  return (
    <AppShell
      title="Instagram Profile Links"
      description="Bulk import publicly visible Instagram profile URLs or usernames"
    >
      <div className="space-y-6">
        <ImportPageNav active="new" />

        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/imports/new" />}
          className="gap-1.5 px-0 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to import types
        </Button>

        <div>
          <h2 className="text-base font-semibold">Bulk Profile Link Import</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Paste profile links or usernames to normalize, validate, and queue
            for future public metadata extraction.
          </p>
        </div>

        <InstagramBulkImportClient />
      </div>
    </AppShell>
  );
}
