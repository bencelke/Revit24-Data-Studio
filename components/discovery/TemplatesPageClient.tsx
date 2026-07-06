"use client";

import { useRouter } from "next/navigation";
import { TemplateSelector } from "./TemplateSelector";
import type { DiscoveryTemplateDocument } from "@/lib/types/discovery-engine";

interface TemplatesPageClientProps {
  templates: DiscoveryTemplateDocument[];
}

export function TemplatesPageClient({ templates }: TemplatesPageClientProps) {
  const router = useRouter();

  return (
    <TemplateSelector
      templates={templates}
      onSelect={(template) => {
        const params = new URLSearchParams({ templateId: template.id });
        router.push(`/discovery/new?${params.toString()}`);
      }}
    />
  );
}
