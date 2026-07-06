import type { Metadata } from "next";
import { AppShell } from "@/components/layout";
import { InstagramExtractorClient } from "@/components/instagram-extractor";
import { getExtractorPageData } from "@/lib/services/instagramPublicExtractorService";

export const metadata: Metadata = {
  title: "Instagram Extractor",
};

export default async function InstagramExtractorPage() {
  const data = await getExtractorPageData();

  return (
    <AppShell
      title="Instagram Extractor"
      description="Paste Instagram profile links and extract public profile metadata."
    >
      <InstagramExtractorClient {...data} />
    </AppShell>
  );
}
