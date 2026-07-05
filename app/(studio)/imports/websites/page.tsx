import type { Metadata } from "next";
import { AppShell } from "@/components/layout";
import { WebsitePageNav, WebsiteDiscoveryClient } from "@/components/websites";
import { ImportPageNav } from "@/components/imports";
import { getWebsitesHubPageData } from "@/lib/services/websiteDiscoveryService";

export const metadata: Metadata = {
  title: "Website Discovery",
};

export default async function ImportsWebsitesPage() {
  const data = await getWebsitesHubPageData();

  return (
    <AppShell
      title="Website Discovery"
      description="Discover and import public metadata from automotive websites"
    >
      <div className="space-y-6">
        <ImportPageNav active="new" />
        <WebsitePageNav active="discover" />
        <WebsiteDiscoveryClient {...data} />
      </div>
    </AppShell>
  );
}
