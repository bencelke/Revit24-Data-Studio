import type { Metadata } from "next";
import { AppShell } from "@/components/layout";
import { InstagramExtractionTest } from "@/components/instagram";
import { getInstagramTestExtractionPageData } from "@/lib/services/instagramTestExtractionService";

export const metadata: Metadata = {
  title: "Instagram Extraction Test",
};

export default function InstagramTestPage() {
  const data = getInstagramTestExtractionPageData();

  return (
    <AppShell
      title="Instagram Extraction Test"
      description="Internal tool — test public profile metadata extraction for a single username or URL"
    >
      <InstagramExtractionTest {...data} />
    </AppShell>
  );
}
