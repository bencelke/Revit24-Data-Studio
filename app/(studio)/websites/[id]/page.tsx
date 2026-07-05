import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout";
import {
  WebsitePageNav,
  WebsiteMetadataCard,
  WebsiteContactsCard,
  WebsiteSocialLinks,
  WebsiteDuplicateIndicator,
} from "@/components/websites";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getWebsiteDetailPageData } from "@/lib/services/websiteDiscoveryService";

interface WebsiteDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: WebsiteDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getWebsiteDetailPageData(id);
  return { title: data ? data.website.title : "Website Detail" };
}

export default async function WebsiteDetailPage({ params }: WebsiteDetailPageProps) {
  const { id } = await params;
  const data = await getWebsiteDetailPageData(id);
  if (!data) notFound();

  const { website, duplicates, normalizationPreview } = data;

  return (
    <AppShell
      title={website.title}
      description="Website overview, public contacts, and entity match preview"
    >
      <div className="space-y-6">
        <WebsitePageNav active="discover" />
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={website.jobId ? `/websites/results?jobId=${website.jobId}` : "/websites/jobs"} />}
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to results
        </Button>

        <WebsiteMetadataCard website={website} normalizationPreview={normalizationPreview} />

        <div className="grid gap-6 lg:grid-cols-2">
          <WebsiteContactsCard website={website} />
          <Card className="border-border bg-card shadow-none">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Detected Social Profiles</CardTitle>
              <CardDescription>Normalized public social links</CardDescription>
            </CardHeader>
            <CardContent>
              <WebsiteSocialLinks links={website.socialLinks} />
            </CardContent>
          </Card>
        </div>

        {duplicates.length > 0 ? (
          <Card className="border-border bg-card shadow-none">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Potential Entity Matches</CardTitle>
              <CardDescription>Detection only — no automatic merge</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {duplicates.map((match) => (
                <WebsiteDuplicateIndicator key={`${match.matchedId}-${match.matchedSource}`} match={match} />
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
