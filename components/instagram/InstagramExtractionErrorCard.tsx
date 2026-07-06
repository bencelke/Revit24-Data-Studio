import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { InstagramPublicProfileError } from "@/workers/instagram/instagramPublicProfileTypes";
import { getPublicProfileErrorLabel } from "@/workers/instagram/instagramPublicProfileTypes";
import { Badge } from "@/components/ui/badge";

interface InstagramExtractionErrorCardProps {
  error: InstagramPublicProfileError;
}

export function InstagramExtractionErrorCard({ error }: InstagramExtractionErrorCardProps) {
  return (
    <Card className="border-red-500/30 bg-card shadow-none">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base text-red-400">Extraction Failed</CardTitle>
          <Badge variant="outline" className="border-red-500/30 text-red-400">
            {getPublicProfileErrorLabel(error.code)}
          </Badge>
        </div>
        <CardDescription>{error.message}</CardDescription>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">
        {error.retryable ? "This error may be retried." : "This error is not retryable."}
      </CardContent>
    </Card>
  );
}
