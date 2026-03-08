import { eq } from 'drizzle-orm';
import { db } from '../repository/db.mts';
import { topics } from '../repository/schema.mts';
import { getDailyVideoStats } from '../repository/stats.mts';
import { runTopic } from './run-topic.mts';
import { logger } from '../config/logger.mts';

async function main(): Promise<void> {
  const activeTopics = db
    .select({ id: topics.id, name: topics.name })
    .from(topics)
    .where(eq(topics.isActive, 1))
    .all();

  logger.info({ count: activeTopics.length }, 'Running digest for active topics');

  for (const topic of activeTopics) {
    await runTopic(topic.id, topic.name);
  }

  const today = new Date().toISOString().slice(0, 10);
  const stats = getDailyVideoStats(today);
  for (const stat of stats) {
    logger.info(
      { topicId: stat.topicId, topic: stat.topicName, date: stat.date, videosFound: stat.videosFound },
      'Daily video count',
    );
  }

  logger.info('All topics processed');
}

main().catch((err) => {
  logger.error(err, 'Fatal error in run-all');
  process.exit(1);
});
