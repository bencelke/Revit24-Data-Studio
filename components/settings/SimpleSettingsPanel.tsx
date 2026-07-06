import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SimpleSettingsData } from "@/lib/types/simpleInstagramImport";

interface SimpleSettingsPanelProps {
  settings: SimpleSettingsData;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function SimpleSettingsPanel({ settings }: SimpleSettingsPanelProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-border bg-card shadow-none">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Firebase</CardTitle>
          <CardDescription>Connection status for Revit24 import queue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Row
            label="Firebase configured"
            value={settings.firebaseConfigured ? "Yes" : "No"}
          />
          <Row label="Data mode" value={settings.dataMode} />
          <div className="pt-2">
            <Badge variant={settings.dataMode === "firestore" ? "default" : "outline"}>
              {settings.dataMode === "firestore" ? "Live Firestore" : "Mock mode"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-none">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Extraction</CardTitle>
          <CardDescription>Public Instagram metadata extraction</CardDescription>
        </CardHeader>
        <CardContent className="space-y-0">
          <Row
            label="Extraction enabled"
            value={settings.extractionEnabled ? "Yes" : "No (mock)"}
          />
          <Row label="Delay between profiles" value={`${settings.extractionDelayMs} ms`} />
          <Row label="Max retries" value={String(settings.extractionMaxRetries)} />
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-none lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Environment variables</CardTitle>
          <CardDescription>Set these in .env.local to change behavior</CardDescription>
        </CardHeader>
        <CardContent className="font-mono text-xs text-muted-foreground">
          <p>ENABLE_INSTAGRAM_EXTRACTION=true</p>
          <p>INSTAGRAM_EXTRACTION_DELAY_MS=5000</p>
          <p>INSTAGRAM_EXTRACTION_MAX_RETRIES=1</p>
          <p className="mt-3">NEXT_PUBLIC_FIREBASE_* for Firestore</p>
        </CardContent>
      </Card>
    </div>
  );
}
