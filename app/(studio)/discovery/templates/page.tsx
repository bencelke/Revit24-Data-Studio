import type { Metadata } from "next";
import { AppShell } from "@/components/layout";
import { DiscoveryPageNav } from "@/components/discovery";
import { TemplatesPageClient } from "@/components/discovery/TemplatesPageClient";
import { listDiscoveryTemplates } from "@/lib/services/discoveryService";

export const metadata: Metadata = {
  title: "Discovery Templates",
};

export default async function DiscoveryTemplatesPage() {
  const templates = await listDiscoveryTemplates();

  return (
    <AppShell
      title="Discovery Templates"
      description="Reusable templates for automotive discovery campaigns"
    >
      <div className="space-y-6">
        <DiscoveryPageNav active="/discovery/templates" />
        <TemplatesPageClient templates={templates} />
      </div>
    </AppShell>
  );
}
