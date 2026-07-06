import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout";
import { PipelineJobDetailClient } from "@/components/pipeline";
import { getPipelineJobDetail } from "@/lib/services/pipelineService";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

interface PipelineJobPageProps {
  params: Promise<{ jobId: string }>;
}

export async function generateMetadata({ params }: PipelineJobPageProps): Promise<Metadata> {
  const { jobId } = await params;
  const detail = await getPipelineJobDetail(jobId);
  return {
    title: detail ? `Pipeline ${detail.job.provider}` : "Pipeline Job",
  };
}

export default async function PipelineJobPage({ params }: PipelineJobPageProps) {
  const { jobId } = await params;
  const detail = await getPipelineJobDetail(jobId);

  if (!detail) {
    notFound();
  }

  return (
    <AppShell
      title="Pipeline Detail"
      description={`Job ${jobId}`}
    >
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          className="-ml-2"
          render={<Link href="/pipeline" />}
        >
          <ChevronLeft className="mr-1 size-4" />
          Back to Pipeline
        </Button>
        <PipelineJobDetailClient {...detail} />
      </div>
    </AppShell>
  );
}
