import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/layout";
import { CampaignDetailClient, DiscoveryPageNav } from "@/components/discovery";
import { Button } from "@/components/ui/button";
import { getDiscoveryCampaignDetail } from "@/lib/services/discoveryService";

interface CampaignDetailPageProps {
  params: Promise<{ campaignId: string }>;
}

export async function generateMetadata({ params }: CampaignDetailPageProps): Promise<Metadata> {
  const { campaignId } = await params;
  const detail = await getDiscoveryCampaignDetail(campaignId);
  return { title: detail ? detail.campaign.name : "Campaign" };
}

export default async function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const { campaignId } = await params;
  const detail = await getDiscoveryCampaignDetail(campaignId);

  if (!detail) {
    notFound();
  }

  return (
    <AppShell title="Campaign Detail" description={detail.campaign.name}>
      <div className="space-y-6">
        <DiscoveryPageNav active="/discovery/campaigns" />
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          className="-ml-2"
          render={<Link href="/discovery/campaigns" />}
        >
          <ChevronLeft className="mr-1 size-4" />
          Back to Campaigns
        </Button>
        <CampaignDetailClient {...detail} />
      </div>
    </AppShell>
  );
}
