"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  GOOGLE_PLACES_BUSINESS_CATEGORIES,
  GOOGLE_PLACES_SEARCH_TYPES,
  type GooglePlacesSearchType,
  type PlacesSearchQuery,
} from "@/lib/types/google-places";
import { getDefaultPlacesSearchQuery } from "@/components/google-places/SearchFilters";

export { getDefaultPlacesSearchQuery };

interface GoogleSearchFormProps {
  query: PlacesSearchQuery;
  onChange: (query: PlacesSearchQuery) => void;
  onSearch: () => void;
  onSave: () => void;
  onClear: () => void;
  onSchedule?: (scheduledAt: string) => void;
  isSearching?: boolean;
}

export function GoogleSearchForm({
  query,
  onChange,
  onSearch,
  onSave,
  onClear,
  onSchedule,
  isSearching,
}: GoogleSearchFormProps) {
  function updateField<K extends keyof PlacesSearchQuery>(key: K, value: PlacesSearchQuery[K]) {
    onChange({ ...query, [key]: value });
  }

  function handleScheduleLater() {
    if (!onSchedule) return;
    const scheduledAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    onSchedule(scheduledAt);
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Search Type">
          <select
            value={query.searchType ?? "text"}
            onChange={(e) => updateField("searchType", e.target.value as GooglePlacesSearchType)}
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
          >
            {GOOGLE_PLACES_SEARCH_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)} Search
              </option>
            ))}
          </select>
        </Field>
        <Field label="Country">
          <Input
            value={query.country}
            onChange={(e) => updateField("country", e.target.value)}
            placeholder="Germany"
          />
        </Field>
        <Field label="State">
          <Input
            value={query.state}
            onChange={(e) => updateField("state", e.target.value)}
            placeholder="Baden-Württemberg"
          />
        </Field>
        <Field label="City">
          <Input
            value={query.city}
            onChange={(e) => updateField("city", e.target.value)}
            placeholder="Stuttgart"
          />
        </Field>
        <Field label="Area">
          <Input
            value={query.area}
            onChange={(e) => updateField("area", e.target.value)}
            placeholder="City Center"
          />
        </Field>
        <Field label="Keyword">
          <Input
            value={query.keyword}
            onChange={(e) => updateField("keyword", e.target.value)}
            placeholder="BMW tuning"
          />
        </Field>
        <Field label="Business Category">
          <select
            value={query.category}
            onChange={(e) =>
              updateField("category", e.target.value as PlacesSearchQuery["category"])
            }
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="">All categories</option>
            {GOOGLE_PLACES_BUSINESS_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Latitude">
          <Input
            type="number"
            step="any"
            value={query.latitude ?? ""}
            onChange={(e) =>
              updateField("latitude", e.target.value ? Number(e.target.value) : null)
            }
            placeholder="48.7758"
          />
        </Field>
        <Field label="Longitude">
          <Input
            type="number"
            step="any"
            value={query.longitude ?? ""}
            onChange={(e) =>
              updateField("longitude", e.target.value ? Number(e.target.value) : null)
            }
            placeholder="9.1829"
          />
        </Field>
        <Field label="Radius (meters)">
          <Input
            type="number"
            value={query.radius}
            onChange={(e) => updateField("radius", Number(e.target.value) || 5000)}
          />
        </Field>
        <Field label="Language">
          <Input
            value={query.language ?? "en"}
            onChange={(e) => updateField("language", e.target.value)}
          />
        </Field>
        <Field label="Result Limit">
          <Input
            type="number"
            value={query.resultLimit ?? 20}
            onChange={(e) => updateField("resultLimit", Number(e.target.value) || 20)}
          />
        </Field>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={onSearch} disabled={isSearching}>
          {isSearching ? "Searching..." : "Search"}
        </Button>
        <Button variant="secondary" onClick={onSave}>
          Save Search
        </Button>
        {onSchedule ? (
          <Button variant="outline" onClick={handleScheduleLater} disabled={isSearching}>
            Schedule +1h
          </Button>
        ) : null}
        <Button variant="outline" onClick={onClear}>
          Clear
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
