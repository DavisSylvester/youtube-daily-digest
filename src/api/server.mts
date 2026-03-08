import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { logger } from '../config/logger.mts';
import { tracePlugin } from './plugins/trace.plugin.mts';
import { topicsRouter } from './topics/router.mts';
import { videosRouter } from './videos/router.mts';

const PORT = 3101;

const apiRoutes = new Elysia({ prefix: '/api/v1' })
  .get('/healthz', () => ({ status: 'ok' }))
  .use(topicsRouter)
  .use(videosRouter);

const app = new Elysia()
  .use(cors({ origin: ['http://localhost:4200'] }))
  .use(swagger({ path: '/docs' }))
  .use(tracePlugin)   // root-level — hooks fire for every route
  .use(apiRoutes)
  .listen(PORT);

logger.info(`API server running at http://localhost:${PORT}`);
logger.info(`Swagger docs at http://localhost:${PORT}/docs`);

export type App = typeof app;
