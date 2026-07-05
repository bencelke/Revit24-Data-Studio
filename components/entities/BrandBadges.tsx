import { Badge } from "@/components/ui/badge";

interface BrandBadgesProps {
  brands: string[];
  label?: string;
}

export function BrandBadges({ brands, label = "Brands" }: BrandBadgesProps) {
  if (brands.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {brands.map((brand) => (
          <Badge key={brand} variant="outline" className="border-brand/30 text-brand">
            {brand}
          </Badge>
        ))}
      </div>
    </div>
  );
}
