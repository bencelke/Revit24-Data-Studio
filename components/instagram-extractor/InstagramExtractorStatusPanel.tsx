"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFirebaseAuth } from "@/components/providers/FirebaseAuthProvider";
import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/config";
import type { StorageMode } from "@/lib/types/instagramExtraction";

interface InstagramExtractorStatusPanelProps {
  storageMode: StorageMode;
  firebaseProjectId: string | null;
}

export function InstagramExtractorStatusPanel({
  storageMode,
  firebaseProjectId,
}: InstagramExtractorStatusPanelProps) {
  const { user, loading, envStatus, initError, isClientReady } = useFirebaseAuth();
  const isFirebaseMode = storageMode === "firebase" && envStatus.configured;
  const projectId = envStatus.projectId || firebaseProjectId;
  const modeLabel =
    isFirebaseMode && isClientReady
      ? "Firebase Connected"
      : envStatus.configured
        ? "Firebase Config Loaded"
        : "Mock Mode";

  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">Mode:</span>
            <Badge variant={isFirebaseMode && isClientReady ? "default" : "outline"}>
              {modeLabel}
            </Badge>
          </div>
          <p>
            <span className="text-muted-foreground">Firebase project:</span>{" "}
            <span className="font-mono text-foreground">{projectId || "Not configured"}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Auth domain:</span>{" "}
            <span className="font-mono text-foreground">
              {envStatus.authDomain || "Not configured"}
            </span>
          </p>
          <p>
            <span className="text-muted-foreground">Queue target:</span>{" "}
            <span className="font-mono text-foreground">
              {FIRESTORE_COLLECTIONS.instagram_extraction_queue}
            </span>
          </p>
          <p>
            <span className="text-muted-foreground">Env configured:</span>{" "}
            <span className="text-foreground">{envStatus.configured ? "true" : "false"}</span>
          </p>
          {envStatus.missingKeys.length > 0 ? (
            <p className="text-xs text-destructive">
              Missing env: {envStatus.missingKeys.join(", ")}
            </p>
          ) : null}
          {initError ? (
            <p className="text-xs text-destructive">{initError}</p>
          ) : null}
          {isFirebaseMode ? (
            <p>
              <span className="text-muted-foreground">Signed in as:</span>{" "}
              {loading ? (
                <span className="text-muted-foreground">Checking session...</span>
              ) : user?.email ? (
                <span className="text-foreground">{user.email}</span>
              ) : (
                <span className="text-destructive">Not signed in</span>
              )}
            </p>
          ) : null}
          {isFirebaseMode && isClientReady && !loading && !user ? (
            <p className="text-muted-foreground">
              Firebase is configured. Sign in before creating extraction jobs.
            </p>
          ) : null}
        </div>
        {isFirebaseMode && isClientReady && !loading && !user ? (
          <Button nativeButton={false} render={<Link href="/login" />} size="sm">
            Sign in
          </Button>
        ) : null}
      </div>
    </div>
  );
}
