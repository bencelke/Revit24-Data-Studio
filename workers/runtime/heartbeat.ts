import { RUNTIME_CONFIG } from "@/lib/config/runtime";

export interface HeartbeatController {
  start(onTick: () => Promise<void>): void;
  stop(): void;
  isRunning(): boolean;
}

export function createHeartbeatController(
  intervalMs = RUNTIME_CONFIG.heartbeatIntervalMs,
): HeartbeatController {
  let timer: ReturnType<typeof setInterval> | null = null;

  return {
    start(onTick) {
      if (timer) return;
      timer = setInterval(() => {
        void onTick();
      }, intervalMs);
    },
    stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    },
    isRunning() {
      return timer !== null;
    },
  };
}

export function isHeartbeatExpired(
  lastHeartbeat: string,
  expiryMs = RUNTIME_CONFIG.heartbeatExpiryMs,
): boolean {
  return Date.now() - new Date(lastHeartbeat).getTime() > expiryMs;
}
