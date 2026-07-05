import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout";
import { EntityDetailClient } from "@/components/entities";
import { getEntityDetail } from "@/lib/services/normalizationPipeline";

interface EntityDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: EntityDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const detail = await getEntityDetail(id);

  return {
    title: detail ? `Entity — ${detail.record.displayName}` : "Entity Detail",
  };
}

export default async function EntityDetailPage({ params }: EntityDetailPageProps) {
  const { id } = await params;
  const detail = await getEntityDetail(id);

  if (!detail) notFound();

  return (
    <AppShell
      title="Entity Preview"
      description="Normalized profile with detected brands, tags, and potential matches"
    >
      <EntityDetailClient initialData={detail} />
    </AppShell>
  );
}
