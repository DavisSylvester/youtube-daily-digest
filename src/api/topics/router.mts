import { Elysia, t } from 'elysia';
import { eq, sql, desc } from 'drizzle-orm';
import { db } from '../../repository/db.mts';
import { topics, topicQueries, runVideos, runs } from '../../repository/schema.mts';
import { runTopic } from '../../jobs/run-topic.mts';
import { logger } from '../../config/logger.mts';

export const topicsRouter = new Elysia()
  .get(
    '/topics',
    async () => {
      const allTopics = await db.select().from(topics).orderBy(topics.id);
      const allQueries = await db.select().from(topicQueries).orderBy(topicQueries.priority);
      const videoCounts = await db
        .select({
          topicId: runVideos.topicId,
          count: sql<number>`count(distinct ${runVideos.videoId})`.as('count'),
        })
        .from(runVideos)
        .groupBy(runVideos.topicId);
      const countMap = new Map(videoCounts.map((r) => [r.topicId, r.count]));

      // Last run per topic
      const lastRuns = await db
        .select({
          topicId: runs.topicId,
          status: runs.status,
          finishedAt: runs.finishedAt,
          startedAt: runs.startedAt,
          discoveredCount: runs.discoveredCount,
        })
        .from(runs)
        .orderBy(desc(runs.startedAt));
      const lastRunMap = new Map(
        lastRuns
          .filter((r, i, arr) => arr.findIndex((x) => x.topicId === r.topicId) === i)
          .map((r) => [r.topicId, r]),
      );

      return allTopics.map((topic) => ({
        ...topic,
        videoCount: countMap.get(topic.id) ?? 0,
        lastRun: lastRunMap.get(topic.id) ?? null,
        queries: allQueries.filter((q) => q.topicId === topic.id),
      }));
    },
    { detail: { summary: 'Get all topics with their queries and video counts' } },
  )

  .post(
    '/topics',
    async ({ body }) => {
      const slug = body.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const [topic] = await db
        .insert(topics)
        .values({ name: body.name.trim(), slug, isActive: 1 })
        .returning();
      return topic;
    },
    {
      body: t.Object({ name: t.String({ minLength: 1 }) }),
      detail: { summary: 'Create a new topic' },
    },
  )

  .post(
    '/topics/:id/search',
    async ({ params }) => {
      logger.info({ topicId: params.id }, 'Search request received');
      const topic = await db
        .select()
        .from(topics)
        .where(eq(topics.id, Number(params.id)))
        .then((rows) => rows[0]);
      if (!topic) {
        logger.warn({ topicId: params.id }, 'Topic not found');
        return new Response('Topic not found', { status: 404 });
      }
      logger.info({ topicId: topic.id, topicName: topic.name }, 'Firing runTopic');
      runTopic(topic.id, topic.name).catch((err: unknown) => {
        logger.error({ topicId: topic.id, err }, 'Search run failed');
      });
      return { started: true, topicId: topic.id };
    },
    {
      params: t.Object({ id: t.String() }),
      detail: { summary: 'Trigger a search run for a topic' },
    },
  )

  .post(
    '/topics/:id/queries',
    async ({ params, body }) => {
      const [query] = await db
        .insert(topicQueries)
        .values({
          topicId: Number(params.id),
          queryText: body.queryText,
          priority: body.priority,
          isActive: 1,
        })
        .returning();
      return query;
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        queryText: t.String({ minLength: 1 }),
        priority: t.Number({ minimum: 1 }),
      }),
      detail: { summary: 'Add a query to a topic' },
    },
  )

  .put(
    '/queries/:id',
    async ({ params, body }) => {
      const [query] = await db
        .update(topicQueries)
        .set({ queryText: body.queryText, priority: body.priority })
        .where(eq(topicQueries.id, Number(params.id)))
        .returning();
      return query;
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        queryText: t.String({ minLength: 1 }),
        priority: t.Number({ minimum: 1 }),
      }),
      detail: { summary: 'Update a query' },
    },
  )

  .patch(
    '/queries/:id/toggle',
    async ({ params, body }) => {
      const [query] = await db
        .update(topicQueries)
        .set({ isActive: body.isActive })
        .where(eq(topicQueries.id, Number(params.id)))
        .returning();
      return query;
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({ isActive: t.Number() }),
      detail: { summary: 'Toggle query active status' },
    },
  )

  .delete(
    '/queries/:id',
    async ({ params }) => {
      await db.delete(topicQueries).where(eq(topicQueries.id, Number(params.id)));
      return { success: true };
    },
    {
      params: t.Object({ id: t.String() }),
      detail: { summary: 'Delete a query' },
    },
  );
