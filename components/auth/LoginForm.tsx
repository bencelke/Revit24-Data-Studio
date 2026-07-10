"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFirebaseAuth } from "@/components/providers/FirebaseAuthProvider";
import { signInWithEmail } from "@/lib/firebase/auth";
import {
  FirebaseInitError,
  FirebaseNotConfiguredError,
  getInstagramQueueErrorMessage,
  isFirestorePermissionDenied,
} from "@/lib/errors/app-errors";
import type { FirebaseEnvStatus } from "@/lib/firebase/firebaseEnv";

interface LoginFormProps {
  initialEnvStatus: FirebaseEnvStatus;
}

export function LoginForm({ initialEnvStatus }: LoginFormProps) {
  const router = useRouter();
  const { envStatus, initError, isClientReady } = useFirebaseAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resolvedEnvStatus = envStatus.configured ? envStatus : initialEnvStatus;
  const resolvedInitError = initError;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await signInWithEmail(email, password);
      router.push("/instagram-extractor");
      router.refresh();
    } catch (signInError) {
      console.error("[login] Firebase sign-in failed:", signInError);
      if (signInError instanceof FirebaseNotConfiguredError) {
        setError(signInError.message);
      } else if (signInError instanceof FirebaseInitError) {
        setError(signInError.message);
      } else if (isFirestorePermissionDenied(signInError)) {
        setError(
          "Firestore permission denied. Confirm the signed-in email is approved and sourcePlatform is instagram.",
        );
      } else {
        setError(getInstagramQueueErrorMessage(signInError));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-border bg-card shadow-none">
      <CardHeader className="space-y-3">
        <div className="flex size-10 items-center justify-center rounded-md bg-brand text-sm font-bold text-brand-foreground">
          R24
        </div>
        <div>
          <CardTitle className="text-xl">Sign in to Data Studio</CardTitle>
          <CardDescription className="mt-1.5">
            Sign in with your approved Firebase email to queue Instagram extraction jobs.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!resolvedEnvStatus.configured ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-3 text-sm text-destructive">
            <p className="font-medium">Firebase is not configured.</p>
            <p className="mt-2 text-muted-foreground">Missing env values:</p>
            <ul className="mt-1 list-disc pl-5 font-mono text-xs">
              {resolvedEnvStatus.missingKeys.map((key) => (
                <li key={key}>{key}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Add values to <span className="font-mono">/Users/boris/Documents/revit24-osint/.env.local</span>,
              then restart with <span className="font-mono">rm -rf .next &amp;&amp; npm run dev</span>.
            </p>
          </div>
        ) : resolvedInitError ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-3 text-sm text-destructive">
            <p>{resolvedInitError}</p>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              <p>
                Firebase project:{" "}
                <span className="font-mono text-foreground">
                  {resolvedEnvStatus.projectId || "carradar-bd6fb"}
                </span>
              </p>
              <p className="mt-1">
                Client ready:{" "}
                <span className="text-foreground">{isClientReady ? "yes" : "no"}</span>
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            {error ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            ) : null}
            <div className="flex items-center justify-between pt-2">
              <Badge variant="outline">Firebase Auth</Badge>
              <Button type="submit" disabled={isSubmitting || !isClientReady}>
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
