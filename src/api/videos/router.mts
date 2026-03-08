import { Elysia, t } from 'elysia';
import { sql } from 'drizzle-orm';
import { db } from '../../repository/db.mts';
import { videos } from '../../repository/schema.mts';

export const videosRouter = new Elysia().get(
  '/videos',
  async ({ query }) => {
    const page = Math.max(1, Number(query.page ?? 1));
    const pageSize = Math.min(200, Math.max(1, Number(query.pageSize ?? 50)));
    const offset = (page - 1) * pageSize;
    const date = query.date ?? null; // YYYY-MM-DD

    const dateFilter = date
      ? sql`date(${videos.firstSeenAt}) = ${date}`
      : sql`1=1`;

    const [allVideos, totalResult] = await Promise.all([
      db
        .select()
        .from(videos)
        .where(dateFilter)
        .orderBy(sql`${videos.publishedAt} DESC`)
        .limit(pageSize)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(videos).where(dateFilter),
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
    }),
    detail: { summary: 'Get videos filtered by date (YYYY-MM-DD), paginated' },
  },
);
