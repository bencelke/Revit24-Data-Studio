"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DataModeBadge, FirestoreStatusBanner } from "@/components/imports/DataModeBadge";
import { SearchFilters, getDefaultPlacesSearchQuery } from "./SearchFilters";
import { SavedSearchCard } from "./SavedSearchCard";
import { PlacesSummaryCards } from "./PlacesSummaryCards";
import type { PlacesSearchPageData, PlacesSearchQuery, SavedSearchDocument } from "@/lib/types/google-places";
import type { ImportDataMode } from "@/lib/types/import-jobs";
import { MOCK_MODE_WARNING } from "@/lib/errors/app-errors";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface GooglePlacesSearchClientProps extends PlacesSearchPageData {
  dataMode: ImportDataMode;
}

export function GooglePlacesSearchClient({
  savedSearches,
  recentJobs,
  dataMode,
  firebaseConfigured,
  googlePlacesConfigured,
  warning,
}: GooglePlacesSearchClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState<PlacesSearchQuery>(getDefaultPlacesSearchQuery());
  const [isSearching, setIsSearching] = useState(false);

  async function handleSearch() {
    setIsSearching(true);
    try {
      const response = await fetch("/api/google-places/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (response.ok) {
        const data = (await response.json()) as { jobId: string };
        router.push(`/google-places/results?jobId=${data.jobId}`);
      }
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSave() {
    const name = `${query.city || "Search"} — ${query.category || query.keyword || "All"}`;
    await fetch("/api/google-places/saved-searches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, query }),
    });
    router.refresh();
  }

  function loadSearch(search: SavedSearchDocument) {
    setQuery({
      country: search.country,
      state: search.state,
      city: search.city,
      area: search.area,
      keyword: search.keyword,
      category: search.category as PlacesSearchQuery["category"],
      radius: search.radius,
      language: "en",
      resultLimit: 20,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DataModeBadge dataMode={dataMode} firebaseConfigured={firebaseConfigured} />
        {!googlePlacesConfigured ? (
          <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
            Google Places API Not Configured — Mock Data
          </span>
        ) : null}
      </div>

      {!firebaseConfigured ? (
        <FirestoreStatusBanner variant="warning" title="Mock Mode" description={MOCK_MODE_WARNING} />
      ) : warning ? (
        <FirestoreStatusBanner variant="warning" title="Mock Data" description={warning} />
      ) : null}

      <PlacesSummaryCards
        totalJobs={recentJobs.length}
        completedJobs={recentJobs.filter((job) => job.status === "completed").length}
        totalPlaces={recentJobs.reduce((sum, job) => sum + job.totalResults, 0)}
        importedPlaces={recentJobs.reduce((sum, job) => sum + job.importedResults, 0)}
      />

      <SearchFilters
        query={query}
        onChange={setQuery}
        onSearch={handleSearch}
        onSave={handleSave}
        onClear={() => setQuery(getDefaultPlacesSearchQuery())}
        isSearching={isSearching}
      />

      {savedSearches.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Saved Searches</h3>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {savedSearches.map((search) => (
              <SavedSearchCard key={search.id} search={search} onLoad={loadSearch} />
            ))}
          </div>
        </div>
      ) : null}

      {recentJobs.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Recent Search Jobs</h3>
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/google-places/jobs" />}>
              View all
            </Button>
          </div>
          <ul className="space-y-2 text-sm">
            {recentJobs.slice(0, 5).map((job) => (
              <li key={job.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span>{job.query.city || job.query.keyword || "Search"} — {job.totalResults} results</span>
                <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/google-places/results?jobId=${job.id}`} />}>
                  View
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
