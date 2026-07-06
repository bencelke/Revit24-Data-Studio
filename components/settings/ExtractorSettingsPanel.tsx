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
          <CardTitle className="text-base font-semibold">Firebase</CardTitle>
          <CardDescription>Connection and storage mode</CardDescription>
        </CardHeader>
        <CardContent className="space-y-0">
          <Row label="Firebase status" value={settings.firebaseStatus} />
          <Row label="Mode" value={settings.mode} />
          <Row
            label="Extraction enabled"
            value={settings.extractionEnabled ? "true" : "false"}
          />
          <div className="pt-4">
            <Badge variant={settings.storageMode === "live" ? "default" : "outline"}>
              {settings.storageMode === "live" ? "Live Firestore storage" : "Mock storage"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-none">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Extraction</CardTitle>
          <CardDescription>Public Instagram profile extraction behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-0">
          <Row label="Delay between profiles" value={`${settings.extractionDelayMs} ms`} />
          <Row label="Max retries" value={String(settings.extractionMaxRetries)} />
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-none lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Environment variables</CardTitle>
          <CardDescription>Set these in .env.local to enable live mode</CardDescription>
        </CardHeader>
        <CardContent className="font-mono text-xs text-muted-foreground">
          <p>NEXT_PUBLIC_FIREBASE_API_KEY=</p>
          <p>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=</p>
          <p>NEXT_PUBLIC_FIREBASE_PROJECT_ID=</p>
          <p>NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=</p>
          <p>NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=</p>
          <p>NEXT_PUBLIC_FIREBASE_APP_ID=</p>
          <p className="mt-3">ENABLE_INSTAGRAM_EXTRACTION=true</p>
          <p>INSTAGRAM_EXTRACTION_DELAY_MS=5000</p>
          <p>INSTAGRAM_EXTRACTION_MAX_RETRIES=1</p>
        </CardContent>
      </Card>
    </div>
  );
}
