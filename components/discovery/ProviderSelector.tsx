"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DiscoveryProvider } from "@/lib/types/discovery-engine";
import { ACTIVE_DISCOVERY_PROVIDERS, DISCOVERY_PROVIDERS } from "@/lib/types/discovery-engine";
import { formatDiscoveryProvider, isProviderActive } from "@/lib/services/keywordGenerationService";
import { cn } from "@/lib/utils";

interface ProviderSelectorProps {
  value: DiscoveryProvider;
  onChange: (provider: DiscoveryProvider) => void;
}

export function ProviderSelector({ value, onChange }: ProviderSelectorProps) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader>
        <CardTitle>Target Provider</CardTitle>
        <CardDescription>Select where to discover automotive entities</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {DISCOVERY_PROVIDERS.map((provider) => {
          const active = isProviderActive(provider);
          const selected = value === provider;
          return (
            <button
              key={provider}
              type="button"
              disabled={!active}
              onClick={() => onChange(provider)}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm transition-colors",
                selected
                  ? "border-orange-500/50 bg-orange-500/10 text-orange-400"
                  : "border-border bg-card text-muted-foreground hover:border-muted-foreground/30",
                !active && "cursor-not-allowed opacity-40",
              )}
            >
              <span className="font-medium">{formatDiscoveryProvider(provider)}</span>
              {!active ? (
                <Badge variant="outline" className="ml-2 text-xs">
                  Soon
                </Badge>
              ) : null}
            </button>
          );
        })}
      </CardContent>
      <CardContent className="pt-0 text-xs text-muted-foreground">
        Active: {ACTIVE_DISCOVERY_PROVIDERS.map(formatDiscoveryProvider).join(", ")}
      </CardContent>
    </Card>
  );
}
