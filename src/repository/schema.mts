import { text, integer, real, sqliteTable, unique } from 'drizzle-orm/sqlite-core';

export const topics = sqliteTable('topics', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  isActive: integer('is_active').notNull().default(1),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
});

export const topicQueries = sqliteTable('topic_queries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  topicId: integer('topic_id').notNull().references(() => topics.id),
  queryText: text('query_text').notNull(),
  priority: integer('priority').notNull().default(1),
  isActive: integer('is_active').notNull().default(1),
});

export const runs = sqliteTable('runs', {
  id: text('id').primaryKey(),
  topicId: integer('topic_id').notNull().references(() => topics.id),
  startedAt: text('started_at').notNull(),
  finishedAt: text('finished_at'),
  status: text('status').notNull(),
  discoveredCount: integer('discovered_count').notNull().default(0),
  shortlistedCount: integer('shortlisted_count').notNull().default(0),
  emailedCount: integer('emailed_count').notNull().default(0),
  htmlPath: text('html_path'),
  logPath: text('log_path'),
  lastPublishedAfter: text('last_published_after'),
});

export const videos = sqliteTable('videos', {
  videoId: text('video_id').primaryKey(),
  title: text('title').notNull(),
  channelId: text('channel_id'),
  channelTitle: text('channel_title'),
  publishedAt: text('published_at').notNull(),
  url: text('url').notNull(),
  description: text('description'),
  thumbnailUrl: text('thumbnail_url'),
  firstSeenAt: text('first_seen_at').notNull().default('CURRENT_TIMESTAMP'),
  isShort: integer('is_short').notNull().default(0),
  defaultLanguage: text('default_language').notNull().default(''),
});

export const runVideos = sqliteTable('run_videos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  runId: text('run_id').notNull().references(() => runs.id),
  topicId: integer('topic_id').notNull().references(() => topics.id),
  videoId: text('video_id').notNull().references(() => videos.videoId),
  queryText: text('query_text').notNull(),
  ruleScore: real('rule_score').notNull().default(0),
  llmScore: real('llm_score').notNull().default(0),
  finalScore: real('final_score').notNull().default(0),
  reason: text('reason'),
  summary: text('summary'),
  includedInEmail: integer('included_in_email').notNull().default(0),
  rankPosition: integer('rank_position'),
}, (t) => [unique().on(t.runId, t.topicId, t.videoId)]);

export const ratings = sqliteTable('ratings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  topicId: integer('topic_id').notNull().references(() => topics.id),
  videoId: text('video_id').notNull().references(() => videos.videoId),
  rating: integer('rating').notNull(),
  feedback: text('feedback'),
  ratedAt: text('rated_at').notNull().default('CURRENT_TIMESTAMP'),
});

export const channelPreferences = sqliteTable('channel_preferences', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  topicId: integer('topic_id').notNull().references(() => topics.id),
  channelId: text('channel_id').notNull(),
  preferenceScore: real('preference_score').notNull().default(0),
}, (t) => [unique().on(t.topicId, t.channelId)]);

export const keywordPreferences = sqliteTable('keyword_preferences', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  topicId: integer('topic_id').notNull().references(() => topics.id),
  keyword: text('keyword').notNull(),
  preferenceScore: real('preference_score').notNull().default(0),
}, (t) => [unique().on(t.topicId, t.keyword)]);
