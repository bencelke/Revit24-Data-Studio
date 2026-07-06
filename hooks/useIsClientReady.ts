"use client";

import { useSyncExternalStore } from "react";

/** Returns false during SSR/hydration and true after the client has mounted. */
export function useIsClientReady(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
