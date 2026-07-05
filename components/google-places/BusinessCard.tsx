import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import type { GooglePlaceRawDocument } from "@/lib/types/google-places";

interface BusinessCardProps {
  place: GooglePlaceRawDocument;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export function BusinessCard({ place, selected, onToggleSelect }: BusinessCardProps) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold">{place.name}</CardTitle>
            <CardDescription>{place.city}, {place.country}</CardDescription>
          </div>
          {onToggleSelect ? (
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggleSelect(place.id)}
              className="mt-1 size-4 accent-brand"
            />
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{place.businessCategory}</Badge>
          <Badge variant="outline">{place.status}</Badge>
        </div>
        {place.rating != null ? (
          <div className="flex items-center gap-1 text-sm">
            <Star className="size-4 fill-brand text-brand" />
            <span>{place.rating.toFixed(1)}</span>
            <span className="text-muted-foreground">({place.reviewCount ?? 0} reviews)</span>
          </div>
        ) : null}
        <Button
          variant="secondary"
          size="sm"
          nativeButton={false}
          render={<Link href={`/google-places/${place.id}`} />}
        >
          View details
        </Button>
      </CardContent>
    </Card>
  );
}
