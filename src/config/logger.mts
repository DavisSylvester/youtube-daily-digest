import pino from 'pino';
import { getTraceId } from './trace.mts';

const isDev = Bun.env['NODE_ENV'] !== 'production';

const base = pino({
  level: Bun.env['LOG_LEVEL'] ?? 'info',
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
});

type LogFn = {
  (obj: object, msg?: string): void;
  (msg: string): void;
};

/** Merge active traceId into every log call automatically. */
function wrap(method: pino.LogFn): LogFn {
  return (objOrMsg: object | string, msg?: string) => {
    const traceId = getTraceId();
    if (typeof objOrMsg === 'string') {
      method.call(base, { traceId }, objOrMsg);
    } else {
      method.call(base, { traceId, ...objOrMsg }, msg);
    }
  };
}

export const logger = {
  trace: wrap(base.trace.bind(base)),
  debug: wrap(base.debug.bind(base)),
  info:  wrap(base.info.bind(base)),
  warn:  wrap(base.warn.bind(base)),
  error: wrap(base.error.bind(base)),
  fatal: wrap(base.fatal.bind(base)),
};
