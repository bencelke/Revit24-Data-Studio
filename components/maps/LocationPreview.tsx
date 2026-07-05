import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MapPin } from "lucide-react";

interface LocationPreviewProps {
  latitude: number;
  longitude: number;
  label?: string;
  address?: string | null;
}

export function LocationPreview({
  latitude,
  longitude,
  label = "Location Preview",
  address,
}: LocationPreviewProps) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <MapPin className="size-4 text-brand" />
          {label}
        </CardTitle>
        <CardDescription>Map rendering deferred — coordinates only</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
          <div className="text-center">
            <MapPin className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">Map Placeholder</p>
            <p className="text-xs text-muted-foreground">
              {latitude.toFixed(5)}, {longitude.toFixed(5)}
            </p>
          </div>
        </div>
        {address ? <p className="text-sm text-muted-foreground">{address}</p> : null}
      </CardContent>
    </Card>
  );
}
