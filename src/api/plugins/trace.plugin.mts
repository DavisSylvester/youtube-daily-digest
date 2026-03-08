import { Elysia } from 'elysia';
import { ulid } from 'ulid';
import { enterTrace } from '../../config/trace.mts';
import { logger } from '../../config/logger.mts';

/**
 * Trace plugin — must be mounted on the ROOT Elysia instance so its
 * onRequest / onAfterHandle hooks fire for every route across all child routers.
 *
 * Flow per request:
 *  1. onRequest  — read x-trace-id or generate a ULID, call enterTrace() so
 *                  every downstream log (including fire-and-forget runTopic)
 *                  carries the same traceId automatically
 *  2. onAfterHandle — log method + path + status on the way out
 *  3. onError       — log unhandled errors
 */
export const tracePlugin = new Elysia({ name: 'trace-plugin' })
  .onRequest(({ request, set }) => {
    const traceId = request.headers.get('x-trace-id') ?? ulid();
    // Bind into AsyncLocalStorage — propagates to all child async ops in this request
    enterTrace(traceId);
    set.headers['x-trace-id'] = traceId;

    const url = new URL(request.url);
    logger.info(
      { method: request.method, path: url.pathname },
      'Request',
    );
  })

  .onAfterHandle(({ request, set }) => {
    const status = (set.status as number | undefined) ?? 200;
    const url = new URL(request.url);
    logger.info({ method: request.method, path: url.pathname, status }, 'Response');
  })

  .onError(({ error, request }) => {
    const url = new URL(request.url);
    logger.error(
      { method: request.method, path: url.pathname, err: String(error) },
      'Request error',
    );
  });
