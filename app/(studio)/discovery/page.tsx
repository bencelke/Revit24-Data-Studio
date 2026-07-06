import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout";
import { DiscoveryDashboard, DiscoveryPageNav } from "@/components/discovery";
import { Button } from "@/components/ui/button";
import { getDiscoveryDashboardData } from "@/lib/services/discoveryService";

export const metadata: Metadata = {
  title: "Discovery Engine",
};

export default async function DiscoveryPage() {
  const data = await getDiscoveryDashboardData();

  return (
    <AppShell
      title="Discovery Engine"
      description="Build automotive discovery campaigns — campaigns generate jobs, jobs flow into the import pipeline"
    >
      <div className="space-y-6">
        <DiscoveryPageNav active="/discovery" />
        <div className="flex justify-end">
          <Button size="sm" nativeButton={false} render={<Link href="/discovery/new" />}>
            <Plus className="mr-2 size-4" />
            New Campaign
          </Button>
        </div>
        <DiscoveryDashboard {...data} />
      </div>
    </AppShell>
  );
}
