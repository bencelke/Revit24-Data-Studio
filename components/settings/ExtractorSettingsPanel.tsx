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
  const storageLabel =
    settings.storageMode === "live" ? "Firebase Live Mode" : "Local Mock Mode";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-border bg-card shadow-none">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Firebase</CardTitle>
          <CardDescription>Shared Revit24.com project connection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-0">
          <Row label="Firebase Status" value={settings.firebaseStatus} />
          <Row label="Project ID" value={settings.firebaseProjectId ?? "Not configured"} />
          <Row label="Storage Mode" value={storageLabel} />
          <Row label="Import Queue" value={settings.importQueueCollection} />
          <Row label="Deployment" value={settings.deployment} />
          <div className="pt-4">
            <Badge variant={settings.firebaseConnected ? "default" : "outline"}>
              {settings.firebaseConnected ? "Connected" : settings.firebaseStatus}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-none">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Extraction</CardTitle>
          <CardDescription>Public Instagram profile extractor</CardDescription>
        </CardHeader>
        <CardContent className="space-y-0">
          <Row
            label="Live extraction"
            value={settings.extractionEnabled ? "Enabled" : "Disabled"}
          />
          <Row label="Current mode" value={settings.mode} />
          <Row label="Delay between profiles" value={`${settings.extractionDelayMs} ms`} />
          <Row label="Max retries" value={String(settings.extractionMaxRetries)} />
          <div className="pt-4">
            <Badge variant={settings.extractionEnabled ? "default" : "outline"}>
              {settings.extractionEnabled ? "Real extractor" : "Mock extractor"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-none lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Vercel environment variables</CardTitle>
          <CardDescription>
            Add these in the Vercel project settings for revit24-data-studio. Do not commit
            .env.local.
          </CardDescription>
        </CardHeader>
        <CardContent className="font-mono text-xs text-muted-foreground">
          <p>NEXT_PUBLIC_FIREBASE_API_KEY</p>
          <p>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</p>
          <p>NEXT_PUBLIC_FIREBASE_PROJECT_ID</p>
          <p>NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET</p>
          <p>NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID</p>
          <p>NEXT_PUBLIC_FIREBASE_APP_ID</p>
          <p className="mt-3">ENABLE_INSTAGRAM_EXTRACTION=false</p>
          <p>INSTAGRAM_EXTRACTION_DELAY_MS=5000</p>
          <p>INSTAGRAM_EXTRACTION_TIMEOUT_MS=30000</p>
          <p>INSTAGRAM_EXTRACTION_MAX_RETRIES=1</p>
        </CardContent>
      </Card>
    </div>
  );
}
