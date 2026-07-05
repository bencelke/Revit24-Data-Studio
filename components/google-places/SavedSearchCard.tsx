import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SavedSearchDocument } from "@/lib/types/google-places";
import { formatImportDate } from "@/lib/services/importService";

interface SavedSearchCardProps {
  search: SavedSearchDocument;
  onLoad: (search: SavedSearchDocument) => void;
  onDelete?: (id: string) => void;
}

export function SavedSearchCard({ search, onLoad, onDelete }: SavedSearchCardProps) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{search.name}</CardTitle>
        <CardDescription>
          {search.city}, {search.country} · {formatImportDate(search.createdAt)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {search.category ? <Badge variant="secondary">{search.category}</Badge> : null}
          {search.keyword ? <Badge variant="outline">{search.keyword}</Badge> : null}
          <Badge variant="outline">{search.radius}m radius</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => onLoad(search)}>
            Load Search
          </Button>
          {onDelete ? (
            <Button variant="ghost" size="sm" onClick={() => onDelete(search.id)}>
              Delete
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
