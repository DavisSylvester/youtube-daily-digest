import { db } from './db.mts';
import { topics, topicQueries } from './schema.mts';

await db.insert(topics).values([
  { name: 'Agentic Loop', slug: 'agentic-loop' },
  { name: 'Ralph Loop', slug: 'ralph-loop' },
]).onConflictDoNothing();

const topicRows = await db.select().from(topics);

for (const topic of topicRows) {
  if (topic.slug === 'agentic-loop') {
    await db.insert(topicQueries).values([
      { topicId: topic.id, queryText: 'agentic loop' },
      { topicId: topic.id, queryText: 'langgraph agent loop' },
    ]).onConflictDoNothing();
  }

  if (topic.slug === 'ralph-loop') {
    await db.insert(topicQueries).values([
      { topicId: topic.id, queryText: 'Ralph loop' },
      { topicId: topic.id, queryText: 'Ralph AI loop' },
    ]).onConflictDoNothing();
  }
}

console.log('Seed complete.');
