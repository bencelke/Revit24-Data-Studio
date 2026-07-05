import type { Metadata } from "next";
import { Plus, Search } from "lucide-react";
import { AppShell } from "@/components/layout";
import {
  DiscoveryTargetCard,
  DiscoveryTargetTable,
  ImportPageNav,
} from "@/components/imports";
import { Button } from "@/components/ui/button";
import { getDiscoveryTargets } from "@/lib/services/instagramProfileImportService";

export const metadata: Metadata = {
  title: "Discovery Queue",
};

export default function DiscoveryPage() {
  const targets = getDiscoveryTargets();

  return (
    <AppShell
      title="Discovery Queue"
      description="Plan future research targets for automotive community data collection"
    >
      <div className="space-y-6">
        <ImportPageNav active="discovery" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Research Targets</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Define discovery queries for future collection — no automation yet.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled className="gap-1.5">
              <Plus className="size-4" />
              New Discovery Target
            </Button>
            <Button variant="outline" size="sm" disabled className="gap-1.5">
              <Search className="size-4" />
              Start Later
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {targets.slice(0, 6).map((target) => (
            <DiscoveryTargetCard key={target.id} target={target} />
          ))}
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold">All Targets</h3>
            <p className="text-sm text-muted-foreground">
              {targets.length} discovery targets across Europe
            </p>
          </div>
          <DiscoveryTargetTable targets={targets} />
        </div>
      </div>
    </AppShell>
  );
}
