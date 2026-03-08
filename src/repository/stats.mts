import { sql, eq, and } from 'drizzle-orm';
import { db } from './db.mts';
import { runs, topics } from './schema.mts';

export interface DailyTopicStat {
  readonly topicId: number;
  readonly topicName: string;
  readonly date: string;
  readonly videosFound: number;
}

export function getDailyVideoStats(date: string): DailyTopicStat[] {
  const rows = db
    .select({
      topicId: runs.topicId,
      topicName: topics.name,
      date: sql<string>`date(${runs.startedAt})`,
      videosFound: sql<number>`sum(${runs.discoveredCount})`,
    })
    .from(runs)
    .innerJoin(topics, eq(runs.topicId, topics.id))
    .where(
      and(
        sql`date(${runs.startedAt}) = ${date}`,
        eq(runs.status, 'success'),
      ),
    )
    .groupBy(runs.topicId)
    .all();

  return rows.map((r) => ({
    topicId: r.topicId,
    topicName: r.topicName,
    date: r.date,
    videosFound: r.videosFound,
  }));
}
