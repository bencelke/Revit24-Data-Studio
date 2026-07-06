"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buildHashtagsFromInput, buildKeywordFromParts } from "@/lib/services/keywordGenerationService";

interface KeywordBuilderProps {
  country?: string;
  city?: string;
  area?: string;
  brand?: string;
  onKeywordsChange: (keywords: string[]) => void;
  onHashtagsChange: (hashtags: string[]) => void;
}

export function KeywordBuilder({
  country,
  city,
  area,
  brand,
  onKeywordsChange,
  onHashtagsChange,
}: KeywordBuilderProps) {
  const [keyword, setKeyword] = useState("");
  const [hashtag, setHashtag] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [generated, setGenerated] = useState<string[]>([]);

  function handleGenerate() {
    const keywords = buildKeywordFromParts({
      country,
      city,
      area,
      brand,
      keyword,
      vehicleType,
      businessCategory,
    });
    const hashtags = buildHashtagsFromInput({ hashtag, brand, keyword });
    setGenerated(keywords);
    onKeywordsChange(keywords);
    onHashtagsChange(hashtags);
  }

  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader>
        <CardTitle>Keyword Builder</CardTitle>
        <CardDescription>Combine location, brand, and category into search terms</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="Keyword (e.g. car meet)" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          <Input placeholder="Hashtag (e.g. bmwclub)" value={hashtag} onChange={(e) => setHashtag(e.target.value)} />
          <Input placeholder="Vehicle type" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} />
          <Input placeholder="Business category" value={businessCategory} onChange={(e) => setBusinessCategory(e.target.value)} />
        </div>
        <Button type="button" variant="secondary" onClick={handleGenerate}>
          Generate Keywords
        </Button>
        {generated.length > 0 ? (
          <ul className="space-y-1 text-sm text-muted-foreground">
            {generated.map((item) => (
              <li key={item} className="rounded-md bg-muted/40 px-2 py-1">
                {item}
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
