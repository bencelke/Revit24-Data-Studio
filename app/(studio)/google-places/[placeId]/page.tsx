import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout";
import { GooglePlacesPageNav } from "@/components/google-places";
import { PlaceDetailsCard } from "@/components/google";
import { Button } from "@/components/ui/button";
import { getPlaceDetailPageData } from "@/lib/services/placesSearchService";

interface PlaceDetailPageProps {
  params: Promise<{ placeId: string }>;
}

export async function generateMetadata({ params }: PlaceDetailPageProps): Promise<Metadata> {
  const { placeId } = await params;
  const data = await getPlaceDetailPageData(placeId);
  return { title: data ? data.place.name : "Business Detail" };
}

export default async function GooglePlaceDetailPage({ params }: PlaceDetailPageProps) {
  const { placeId } = await params;
  const data = await getPlaceDetailPageData(placeId);
  if (!data) notFound();

  return (
    <AppShell
      title={data.place.name}
      description="Business information, location, and duplicate detection"
    >
      <div className="space-y-6">
        <GooglePlacesPageNav active="search" />
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={data.place.searchJobId ? `/google-places/results?jobId=${data.place.searchJobId}` : "/google-places/search"} />}
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to results
        </Button>
        <PlaceDetailsCard place={data.place} duplicates={data.duplicates} />
      </div>
    </AppShell>
  );
}
