import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/layout";
import { CampaignCard, DiscoveryPageNav } from "@/components/discovery";
import { Button } from "@/components/ui/button";
import { getCampaignListResult } from "@/lib/services/campaignService";
import { Plus } from "lucide-react";

export const metadata: Metadata = {
  title: "Discovery Campaigns",
};

export default async function DiscoveryCampaignsPage() {
  const { campaigns } = await getCampaignListResult(1, 50);

  return (
    <AppShell
      title="Discovery Campaigns"
      description="All discovery campaigns"
    >
      <div className="space-y-6">
        <DiscoveryPageNav active="/discovery/campaigns" />
        <div className="flex justify-end">
          <Button size="sm" nativeButton={false} render={<Link href="/discovery/new" />}>
            <Plus className="mr-2 size-4" />
            New Campaign
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
