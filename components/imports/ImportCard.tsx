import Link from "next/link";
import {
  FileSpreadsheet,
  Globe,
  MapPin,
  PenLine,
  Plug,
  Puzzle,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ImportType, ImportTypeDefinition } from "@/lib/types/imports";

const typeIcons: Record<ImportType, LucideIcon> = {
  instagram: Users,
  google_places: MapPin,
  public_website: Globe,
  csv_upload: FileSpreadsheet,
  manual_entry: PenLine,
  browser_extension: Puzzle,
  api_import: Plug,
};

interface ImportCardProps {
  definition: ImportTypeDefinition;
  href?: string;
  className?: string;
}

export function ImportCard({ definition, href, className }: ImportCardProps) {
  const Icon = typeIcons[definition.type];
  const isAvailable = definition.availability === "available";

  const content = (
    <Card
      className={cn(
        "border-border bg-card shadow-none transition-colors",
        isAvailable && href && "hover:border-brand/40 hover:bg-accent/30",
        !isAvailable && "opacity-80",
        className,
      )}
    >
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex size-10 items-center justify-center rounded-md border border-border bg-background">
            <Icon className="size-5 text-brand" aria-hidden />
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Badge
              variant="outline"
              className={cn(
                isAvailable
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-border text-muted-foreground",
              )}
            >
              {isAvailable ? "Available" : "Coming Soon"}
            </Badge>
            {definition.futureLabel ? (
              <span className="text-[11px] text-muted-foreground">
                {definition.futureLabel}
              </span>
            ) : null}
          </div>
        </div>
        <div>
          <CardTitle className="text-base font-semibold">
            {definition.title}
          </CardTitle>
          <CardDescription className="mt-1.5 leading-relaxed">
            {definition.description}
          </CardDescription>
        </div>
      </CardHeader>
      {isAvailable ? (
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Select to configure import settings
          </p>
        </CardContent>
      ) : null}
    </Card>
  );

  if (isAvailable && href) {
    return (
      <Link href={href} className="block focus-visible:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
