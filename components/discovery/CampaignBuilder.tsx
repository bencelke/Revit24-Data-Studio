"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  DiscoveryEntityType,
  DiscoveryProvider,
  DiscoveryTemplateDocument,
} from "@/lib/types/discovery-engine";
import { DISCOVERY_ENTITY_TYPES } from "@/lib/types/discovery-engine";
import { ProviderSelector } from "./ProviderSelector";
import { KeywordBuilder } from "./KeywordBuilder";
import { TemplateSelector } from "./TemplateSelector";

interface CampaignBuilderProps {
  templates: DiscoveryTemplateDocument[];
  onSubmit: (payload: {
    name: string;
    description: string;
    country: string;
    city: string;
    area: string;
    provider: DiscoveryProvider;
    entityTypes: DiscoveryEntityType[];
    keywords: string[];
    hashtags: string[];
    brands: string[];
    templateId: string | null;
  }) => Promise<void>;
}

export function CampaignBuilder({ templates, onSubmit }: CampaignBuilderProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [provider, setProvider] = useState<DiscoveryProvider>("instagram");
  const [entityTypes, setEntityTypes] = useState<DiscoveryEntityType[]>(["club"]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [brandInput, setBrandInput] = useState("");
  const [loading, setLoading] = useState(false);

  function toggleEntityType(type: DiscoveryEntityType) {
    setEntityTypes((current) =>
      current.includes(type) ? current.filter((t) => t !== type) : [...current, type],
    );
  }

  function applyTemplate(template: DiscoveryTemplateDocument) {
    setName(template.name);
    setDescription(template.description);
    setProvider(template.provider);
    setEntityTypes(template.entityTypes);
    setKeywords(template.keywords);
    setHashtags(template.hashtags);
    setBrands(template.brands);
  }

  async function handleSubmit() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        country: country.trim(),
        city: city.trim(),
        area: area.trim(),
        provider,
        entityTypes,
        keywords,
        hashtags,
        brands,
        templateId: null,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="space-y-6 xl:col-span-2">
        <Card className="border-border bg-card shadow-none">
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
            <CardDescription>Define your automotive discovery campaign</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Campaign name (e.g. BMW Clubs Germany)" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            <div className="grid gap-4 sm:grid-cols-3">
              <Input placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
              <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
              <Input placeholder="Area" value={area} onChange={(e) => setArea(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <ProviderSelector value={provider} onChange={setProvider} />

        <Card className="border-border bg-card shadow-none">
          <CardHeader>
            <CardTitle>Entity Types</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {DISCOVERY_ENTITY_TYPES.map((type) => (
              <Button
                key={type}
                type="button"
                size="sm"
                variant={entityTypes.includes(type) ? "default" : "outline"}
                onClick={() => toggleEntityType(type)}
              >
                {type.replace(/_/g, " ")}
              </Button>
            ))}
          </CardContent>
        </Card>

        <KeywordBuilder
          country={country}
          city={city}
          area={area}
          brand={brandInput}
          onKeywordsChange={setKeywords}
          onHashtagsChange={setHashtags}
        />

        <Card className="border-border bg-card shadow-none">
          <CardHeader>
            <CardTitle>Brands</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input
              placeholder="Brand (e.g. BMW)"
              value={brandInput}
              onChange={(e) => setBrandInput(e.target.value)}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (brandInput.trim()) {
                  setBrands((b) => [...new Set([...b, brandInput.trim()])]);
                  setBrandInput("");
                }
              }}
            >
              Add
            </Button>
          </CardContent>
        </Card>

        <Button onClick={() => void handleSubmit()} disabled={loading || !name.trim()} className="w-full sm:w-auto">
          {loading ? "Creating…" : "Create Campaign"}
        </Button>
      </div>

      <div>
        <TemplateSelector templates={templates} onSelect={applyTemplate} />
      </div>
    </div>
  );
}
