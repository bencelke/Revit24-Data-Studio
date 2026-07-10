"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { getFirebaseApp, getFirebaseInitError } from "@/lib/firebase/app";
import { subscribeToAuthState } from "@/lib/firebase/auth";
import { getFirebaseEnvStatus, type FirebaseEnvStatus } from "@/lib/firebase/firebaseEnv";

interface FirebaseAuthContextValue {
  user: User | null;
  loading: boolean;
  isSignedIn: boolean;
  envStatus: FirebaseEnvStatus;
  initError: string | null;
  isClientReady: boolean;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextValue>({
  user: null,
  loading: true,
  isSignedIn: false,
  envStatus: {
    configured: false,
    projectId: "",
    authDomain: "",
    missingKeys: [],
  },
  initError: null,
  isClientReady: false,
});

function resolveInitError(configured: boolean): string | null {
  if (!configured) {
    return null;
  }

  const app = getFirebaseApp();
  if (app) {
    return null;
  }

  return (
    getFirebaseInitError()?.message ??
    "Firebase config loaded but Firebase initialization failed. Check client config."
  );
}

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const envStatus = useMemo(() => getFirebaseEnvStatus(), []);
  const initError = useMemo(() => resolveInitError(envStatus.configured), [envStatus.configured]);
  const isClientReady = envStatus.configured && initError == null && getFirebaseApp() != null;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isClientReady);

  useEffect(() => {
    if (!isClientReady) {
      return;
    }

    const unsubscribe = subscribeToAuthState((nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });

    return () => {
      unsubscribe?.();
    };
  }, [isClientReady]);

  const value = useMemo(
    () => ({
      user,
      loading: isClientReady ? loading : false,
      isSignedIn: user != null,
      envStatus,
      initError,
      isClientReady,
    }),
    [user, loading, envStatus, initError, isClientReady],
  );

  return <FirebaseAuthContext.Provider value={value}>{children}</FirebaseAuthContext.Provider>;
}

export function useFirebaseAuth(): FirebaseAuthContextValue {
  return useContext(FirebaseAuthContext);
}
