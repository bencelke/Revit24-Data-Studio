export interface ShutdownHandler {
  register(onShutdown: () => Promise<void>): void;
  trigger(): Promise<void>;
}

export function createShutdownHandler(): ShutdownHandler {
  const handlers: Array<() => Promise<void>> = [];
  let registered = false;

  function register(onShutdown: () => Promise<void>) {
    handlers.push(onShutdown);

    if (registered) return;
    registered = true;

    const signalHandler = () => {
      void trigger();
    };

    process.on("SIGINT", signalHandler);
    process.on("SIGTERM", signalHandler);
  }

  async function trigger() {
    for (const handler of handlers) {
      await handler();
    }
  }

  return { register, trigger };
}
