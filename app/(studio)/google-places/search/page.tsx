import type { Metadata } from "next";
import { AppShell } from "@/components/layout";
import { GooglePlacesPageNav, GooglePlacesSearchClient } from "@/components/google-places";
import { getPlacesSearchPageData } from "@/lib/services/placesSearchService";

export const metadata: Metadata = {
  title: "Google Places Search",
};

export default async function GooglePlacesSearchPage() {
  const data = await getPlacesSearchPageData();

  return (
    <AppShell
      title="Google Places Search"
      description="Discover automotive businesses by location, category, and keyword"
    >
      <div className="space-y-6">
        <GooglePlacesPageNav active="search" />
        <GooglePlacesSearchClient {...data} />
      </div>
    </AppShell>
  );
}
