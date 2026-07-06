"use client";

import { useRouter } from "next/navigation";
import { CampaignBuilder, DiscoveryPageNav } from "@/components/discovery";
import type { DiscoveryTemplateDocument } from "@/lib/types/discovery-engine";

interface NewCampaignPageClientProps {
  templates: DiscoveryTemplateDocument[];
}

export function NewCampaignPageClient({ templates }: NewCampaignPageClientProps) {
  const router = useRouter();

  async function handleSubmit(payload: Parameters<
    React.ComponentProps<typeof CampaignBuilder>["onSubmit"]
  >[0]) {
    const response = await fetch("/api/discovery/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const campaign = (await response.json()) as { id: string };
      router.push(`/discovery/campaigns/${campaign.id}`);
    }
  }

  return (
    <div className="space-y-6">
      <DiscoveryPageNav active="/discovery/new" />
      <CampaignBuilder templates={templates} onSubmit={handleSubmit} />
    </div>
  );
}
