import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { DataModeBadge } from "@/components/imports/DataModeBadge";
import { InstagramProfilePreview } from "@/components/instagram";
import { getInstagramProfilePageData } from "@/lib/services/instagramBulkExtractionService";

interface InstagramProfileDetailPageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({
  params,
}: InstagramProfileDetailPageProps): Promise<Metadata> {
  const { username } = await params;
  const data = await getInstagramProfilePageData(username);
  return {
    title: data
      ? `${data.profile.displayName ?? data.profile.username} — Instagram`
      : `Profile — ${username}`,
  };
}

export default async function InstagramProfileDetailPage({
  params,
}: InstagramProfileDetailPageProps) {
  const { username } = await params;
  const data = await getInstagramProfilePageData(username);
  if (!data) notFound();

  return (
    <AppShell
      title={`@${data.profile.username}`}
      description="Internal profile preview — public metadata only"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href="/instagram/profiles" />}
            className="gap-1.5 px-0 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to profiles
          </Button>
          <DataModeBadge dataMode={data.dataMode} firebaseConfigured={data.firebaseConfigured} />
        </div>

        <InstagramProfilePreview
          profile={data.profile}
          normalizedRecord={data.normalizedRecord}
          duplicateMatches={data.duplicateMatches}
          reviewStatus={data.reviewStatus}
        />
      </div>
    </AppShell>
  );
}
