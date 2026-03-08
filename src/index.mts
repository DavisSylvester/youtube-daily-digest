import { logger } from './config/logger.mts';
import { env } from './env.mts';

logger.info(
  {
    youtubeKey: env.YOUTUBE_API_KEY ? '***set***' : 'MISSING',
    ollamaModel: env.OLLAMA_MODEL,
    ollamaBase: env.OLLAMA_BASE_URL,
    emailTo: env.EMAIL_TO ?? 'not set',
    appBase: env.APP_BASE_URL,
  },
  'YouTube Daily Digest — config OK',
);

logger.info('Run `bun src/jobs/run-all.mts` to process all topics');
logger.info('Run `bun src/ratings/server.mts` to start the rating server');
