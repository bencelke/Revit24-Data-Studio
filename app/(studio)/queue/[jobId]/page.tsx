import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout";
import { QueueDetailClient, QueuePageNav } from "@/components/queue";
import { getQueueJobDetail } from "@/lib/services/queueService";

interface QueueJobPageProps {
  params: Promise<{ jobId: string }>;
}

export async function generateMetadata({
  params,
}: QueueJobPageProps): Promise<Metadata> {
  const { jobId } = await params;
  const detail = await getQueueJobDetail(jobId);

  return {
    title: detail ? `Queue — ${detail.job.name}` : "Extraction Job",
  };
}

export default async function QueueJobPage({ params }: QueueJobPageProps) {
  const { jobId } = await params;
  const detail = await getQueueJobDetail(jobId);

  if (!detail) notFound();

  return (
    <AppShell
      title="Extraction Job"
      description="Job summary, progress, and extraction records"
    >
      <div className="space-y-6">
        <QueuePageNav active="overview" />
        <QueueDetailClient initialData={detail} />
      </div>
    </AppShell>
  );
}
