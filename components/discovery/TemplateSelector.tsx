import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DiscoveryTemplateDocument } from "@/lib/types/discovery-engine";
import { formatDiscoveryProvider } from "@/lib/services/keywordGenerationService";

interface TemplateSelectorProps {
  templates: DiscoveryTemplateDocument[];
  onSelect?: (template: DiscoveryTemplateDocument) => void;
}

export function TemplateSelector({ templates, onSelect }: TemplateSelectorProps) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader>
        <CardTitle>Templates</CardTitle>
        <CardDescription>Reusable discovery campaign templates</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect?.(template)}
            className="w-full rounded-lg border border-border bg-muted/20 p-3 text-left transition-colors hover:border-orange-500/30 hover:bg-muted/40"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{template.name}</span>
              {template.isBuiltIn ? (
                <Badge variant="outline" className="text-xs">
                  Built-in
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {template.description}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {formatDiscoveryProvider(template.provider)} · {template.category}
            </p>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
