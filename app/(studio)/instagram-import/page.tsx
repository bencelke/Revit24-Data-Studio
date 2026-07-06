import type { Metadata } from "next";
import { AppShell } from "@/components/layout";
import { InstagramImportClient } from "@/components/instagram-import";
import { getInstagramSimpleImportPageData } from "@/lib/services/instagramSimpleImportService";

export const metadata: Metadata = {
  title: "Instagram Import",
};

export default async function InstagramImportPage() {
  const data = await getInstagramSimpleImportPageData();

  return (
    <AppShell
      title="Instagram Import"
      description="Paste Instagram profile links and extract public profile metadata for Revit24."
    >
      <InstagramImportClient {...data} />
    </AppShell>
  );
}
