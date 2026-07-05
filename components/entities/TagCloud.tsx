import { Badge } from "@/components/ui/badge";

interface TagCloudProps {
  tags: string[];
  label?: string;
}

export function TagCloud({ tags, label = "Tags" }: TagCloudProps) {
  if (tags.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="font-normal">
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
}
