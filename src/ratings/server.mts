import { db } from '../repository/db.mts';
import { ratings } from '../repository/schema.mts';
import { logger } from '../config/logger.mts';

const PORT = 3000;

Bun.serve({
  port: PORT,
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === '/rate') {
      const topicId = Number(url.searchParams.get('topicId'));
      const videoId = url.searchParams.get('videoId');
      const ratingVal = Number(url.searchParams.get('rating'));

      if (!topicId || !videoId || !ratingVal) {
        return new Response('Missing params', { status: 400 });
      }

      db.insert(ratings)
        .values({
          topicId,
          videoId,
          rating: ratingVal,
          ratedAt: new Date().toISOString(),
        })
        .run();

      logger.info({ topicId, videoId, rating: ratingVal }, 'Rating saved');

      return new Response(
        `<html><body><h1>Thanks</h1><p>Your rating was saved.</p></body></html>`,
        { headers: { 'Content-Type': 'text/html' } },
      );
    }

    return new Response('Not found', { status: 404 });
  },
});

logger.info({ port: PORT }, 'Ratings server started');
