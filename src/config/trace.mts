import { AsyncLocalStorage } from 'node:async_hooks';

const traceStorage = new AsyncLocalStorage<string>();

/** Read the active trace ID from anywhere in the async call chain. */
export function getTraceId(): string {
  return traceStorage.getStore() ?? 'no-trace';
}

/**
 * Bind `traceId` to the current async context and all child async operations.
 * Uses `enterWith` so fire-and-forget tasks (e.g. runTopic) inherit the trace
 * without needing an explicit `run()` wrapper.
 */
export function enterTrace(traceId: string): void {
  traceStorage.enterWith(traceId);
}
