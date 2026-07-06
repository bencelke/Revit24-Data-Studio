import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/layout";
import { InstagramProfilesTable } from "@/components/instagram";
import { Button } from "@/components/ui/button";
import { listInstagramProfilesForStudio } from "@/lib/services/instagramBulkExtractionService";

export const metadata: Metadata = {
  title: "Instagram Profiles",
};

export default async function InstagramProfilesPage() {
  const profiles = await listInstagramProfilesForStudio();

  return (
    <AppShell
      title="Instagram Profiles"
      description="Extracted public profile metadata awaiting review"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            nativeButton={false}
            render={<Link href="/instagram/extraction" />}
          >
            Extraction Dashboard
          </Button>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/imports/new/instagram" />}
          >
            Bulk Import
          </Button>
        </div>
        <InstagramProfilesTable profiles={profiles} />
      </div>
    </AppShell>
  );
}
