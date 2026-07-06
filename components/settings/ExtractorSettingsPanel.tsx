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
      <span className="max-w-[60%] text-right font-medium break-all">{value}</span>
    </div>
  );
}

export function ExtractorSettingsPanel({ settings }: ExtractorSettingsPanelProps) {
  const storageLabel =
    settings.storageMode === "live" ? "Firebase Live Mode" : "Mock localStorage";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-border bg-card shadow-none">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Firebase</CardTitle>
          <CardDescription>Shared Revit24.com project connection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-0">
          <Row label="Firebase" value={settings.firebaseStatus} />
          <Row label="Project ID" value={settings.firebaseProjectId ?? "missing"} />
          <Row label="Storage mode" value={storageLabel} />
          <Row label="Import Queue" value={settings.importQueueCollection} />
          <Row label="Deployment" value={settings.deployment} />
          {settings.missingFirebaseEnvVars.length > 0 ? (
            <div className="border-b border-border py-3 text-sm last:border-0">
              <p className="text-muted-foreground">Missing env vars</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {settings.missingFirebaseEnvVars.join(", ")}
              </p>
            </div>
          ) : null}
          <div className="pt-4">
            <Badge variant={settings.firebaseConnected ? "default" : "outline"}>
              {settings.firebaseConnected ? "Connected" : settings.firebaseStatus}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-none">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Instagram extraction</CardTitle>
          <CardDescription>Queued on Vercel, processed by local worker</CardDescription>
        </CardHeader>
        <CardContent className="space-y-0">
          <Row label="Storage mode" value={storageLabel} />
          <Row label="Extraction mode" value="Local worker" />
          <Row label="Pending queue" value={String(settings.pendingQueueCount)} />
          <Row label="Results count" value={String(settings.resultsCount)} />
          <Row label="Worker command" value="npm run worker:instagram" />
          <div className="pt-4">
            <Badge variant="outline">Local worker extraction</Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-none lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Vercel environment variables</CardTitle>
          <CardDescription>
            Add these in Vercel → Settings → Environment Variables, then redeploy. Do not commit
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
          <p className="mt-3">ENABLE_INSTAGRAM_EXTRACTION=true (local worker only)</p>
          <p>INSTAGRAM_WORKER_BATCH_SIZE=1</p>
          <p>INSTAGRAM_WORKER_DELAY_MS=5000</p>
          <p>INSTAGRAM_WORKER_MAX_RETRIES=1</p>
          <p>INSTAGRAM_WORKER_TIMEOUT_MS=30000</p>
        </CardContent>
      </Card>
    </div>
  );
}
