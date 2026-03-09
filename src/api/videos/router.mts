import { Elysia, t } from 'elysia';
import { sql, or, eq } from 'drizzle-orm';
import { db } from '../../repository/db.mts';
import { ratings, runVideos, videos } from '../../repository/schema.mts';

export const videosRouter = new Elysia().get(
  '/videos',
  async ({ query }) => {
    const page = Math.max(1, Number(query.page ?? 1));
    const pageSize = Math.min(200, Math.max(1, Number(query.pageSize ?? 50)));
    const offset = (page - 1) * pageSize;
    const date = query.date ?? null;        // YYYY-MM-DD
    const englishOnly = (query.englishOnly ?? 'true') !== 'false';

    const dateFilter = date
      ? sql`date(${videos.firstSeenAt}) = ${date}`
      : sql`1=1`;

    // English filter: keep videos where defaultLanguage starts with 'en' OR is empty/unknown
    // Empty means YouTube didn't report a language — we include those rather than hiding them
    const langFilter = englishOnly
      ? or(
          sql`${videos.defaultLanguage} = ''`,
          sql`${videos.defaultLanguage} LIKE 'en%'`,
        )!
      : sql`1=1`;

    const whereClause = sql`(${dateFilter}) AND (${langFilter})`;

    const [allVideos, totalResult] = await Promise.all([
      db
        .select()
        .from(videos)
        .where(whereClause)
        .orderBy(sql`${videos.publishedAt} DESC`)
        .limit(pageSize)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(videos).where(whereClause),
    ]);

    return {
      videos: allVideos,
      total: totalResult[0]?.count ?? 0,
      page,
      pageSize,
    };
  },
  {
    query: t.Object({
      page: t.Optional(t.String()),
      pageSize: t.Optional(t.String()),
      date: t.Optional(t.String()),
      englishOnly: t.Optional(t.String()),
    }),
    detail: { summary: 'Get videos filtered by date and/or language, paginated' },
  },
)
  .delete(
    '/videos/:videoId',
    async ({ params, body, error: err }) => {
      const { videoId } = params;

      const existing = await db
        .select({ videoId: videos.videoId })
        .from(videos)
        .where(eq(videos.videoId, videoId))
        .limit(1);

      if (existing.length === 0) {
        return err(404, { error: 'Video not found' });
      }

      db.transaction((tx) => {
        tx.delete(runVideos).where(eq(runVideos.videoId, videoId)).run();
        tx.delete(ratings).where(eq(ratings.videoId, videoId)).run();
        tx.delete(videos).where(eq(videos.videoId, videoId)).run();
      });

      return { success: true, deletedVideoId: videoId };
    },
    {
      params: t.Object({ videoId: t.String() }),
      body: t.Object({ reason: t.String({ minLength: 1 }) }),
      detail: { summary: 'Delete a video and its associated run_videos and ratings records' },
    },
  );
