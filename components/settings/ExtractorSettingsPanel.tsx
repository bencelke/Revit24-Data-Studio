import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ExtractorSettingsData } from "@/lib/types/instagramExtraction";

interface ExtractorSettingsPanelProps {
  settings: ExtractorSettingsData;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function ExtractorSettingsPanel({ settings }: ExtractorSettingsPanelProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-border bg-card shadow-none">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Extractor</CardTitle>
          <CardDescription>Public Instagram profile extraction behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-0">
          <Row label="Extractor mode" value={settings.extractorMode} />
          <Row label="Mock mode" value={settings.mockMode ? "Active" : "Inactive"} />
          <Row
            label="Extraction enabled"
            value={settings.extractionEnabled ? "Yes" : "No"}
          />
          <Row label="Delay between profiles" value={`${settings.extractionDelayMs} ms`} />
          <Row label="Max retries" value={String(settings.extractionMaxRetries)} />
          <div className="pt-4">
            <Badge variant={settings.extractorMode === "live" ? "default" : "outline"}>
              {settings.extractorMode === "live" ? "Live provider" : "Mock provider"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-none">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Environment variables</CardTitle>
          <CardDescription>Set these in .env.local to change behavior</CardDescription>
        </CardHeader>
        <CardContent className="font-mono text-xs text-muted-foreground">
          <p>ENABLE_INSTAGRAM_EXTRACTION=true</p>
          <p>INSTAGRAM_EXTRACTION_DELAY_MS=5000</p>
          <p>INSTAGRAM_EXTRACTION_MAX_RETRIES=1</p>
          <p>INSTAGRAM_EXTRACTION_MODE=mock</p>
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-none lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Coming next</CardTitle>
          <CardDescription>Architecture is ready for future phases</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <ul className="list-inside list-disc space-y-1">
            <li>Mass upload to Revit24.com</li>
            <li>User claim system</li>
            <li>Account verification</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
