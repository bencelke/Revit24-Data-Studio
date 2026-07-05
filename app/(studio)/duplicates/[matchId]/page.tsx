import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout";
import { DuplicatesPageNav, DuplicateMatchDetailClient } from "@/components/duplicates";
import { getDuplicateMatchDetail } from "@/lib/services/duplicateResolutionService";

interface MatchDetailPageProps {
  params: Promise<{ matchId: string }>;
}

export async function generateMetadata({ params }: MatchDetailPageProps): Promise<Metadata> {
  const { matchId } = await params;
  const data = await getDuplicateMatchDetail(matchId);
  return {
    title: data
      ? `${data.recordA.displayName} vs ${data.recordB.displayName}`
      : "Match Detail",
  };
}

export default async function DuplicateMatchDetailPage({ params }: MatchDetailPageProps) {
  const { matchId } = await params;
  const data = await getDuplicateMatchDetail(matchId);
  if (!data) notFound();

  return (
    <AppShell
      title="Match Comparison"
      description="Side-by-side comparison and merge resolution"
    >
      <div className="space-y-6">
        <DuplicatesPageNav active="pending" />
        <DuplicateMatchDetailClient initialData={data} />
      </div>
    </AppShell>
  );
}
