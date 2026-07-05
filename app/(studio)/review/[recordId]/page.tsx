import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout";
import { ReviewDetailClient, ReviewPageNav } from "@/components/review";
import { getReviewRecordDetail } from "@/lib/services/reviewService";

interface ReviewRecordPageProps {
  params: Promise<{ recordId: string }>;
}

export async function generateMetadata({
  params,
}: ReviewRecordPageProps): Promise<Metadata> {
  const { recordId } = await params;
  const detail = await getReviewRecordDetail(recordId);

  return {
    title: detail
      ? `Review — ${detail.record.displayName ?? detail.record.username ?? recordId}`
      : "Review Record",
  };
}

export default async function ReviewRecordPage({ params }: ReviewRecordPageProps) {
  const { recordId } = await params;
  const detail = await getReviewRecordDetail(recordId);

  if (!detail) notFound();

  return (
    <AppShell
      title="Record Review"
      description="Review, edit, and approve individual import records"
    >
      <div className="space-y-6">
        <ReviewPageNav active="queue" />
        <ReviewDetailClient initialData={detail} />
      </div>
    </AppShell>
  );
}
