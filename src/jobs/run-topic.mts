import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { and, desc, asc, eq } from 'drizzle-orm';
import { db } from '../repository/db.mts';
import { runs, topicQueries, runVideos } from '../repository/schema.mts';
import { searchNewVideos } from '../youtube/fetch.mts';
import { upsertVideo, attachRunVideo } from '../youtube/store.mts';
import { scoreByRules } from '../ranking/rules.mts';
import { assessVideo } from '../ranking/ollama.mts';
import { renderDigest } from '../digest/render.mts';
import { sendDigestEmail } from '../digest/send.mts';
import { env } from '../env.mts';
import { logger } from '../config/logger.mts';
import type { FoundVideo } from '../youtube/fetch.mts';

const REPORTS_DIR = join(import.meta.dir, '../../reports');
const RULE_SHORTLIST = 12;
const EMAIL_TOP = 6;
const RULE_WEIGHT = 0.55;
const LLM_WEIGHT = 0.45;

function getPublishedAfter(topicId: number): string {
  const row = db
    .select({ finishedAt: runs.finishedAt })
    .from(runs)
    .where(and(eq(runs.topicId, topicId), eq(runs.status, 'success')))
    .orderBy(desc(runs.finishedAt))
    .limit(1)
    .get();

  return row?.finishedAt ?? new Date(Date.now() - 24 * 3600 * 1000).toISOString();
}

interface ScoredVideo extends FoundVideo {
  readonly ruleScore: number;
}

interface EnrichedVideo extends ScoredVideo {
  readonly llmScore: number;
  readonly finalScore: number;
  readonly summary: string;
  readonly reason: string;
}

export async function runTopic(topicId: number, topicName: string): Promise<void> {
  const runId = randomUUID();
  const startedAt = new Date().toISOString();
  const publishedAfter = getPublishedAfter(topicId);

  logger.info({ runId, topicId, topicName, publishedAfter }, 'Starting run');

  db.insert(runs).values({
    id: runId,
    topicId,
    startedAt,
    status: 'running',
    lastPublishedAfter: publishedAfter,
  }).run();

  try {
    // Fetch videos for every active query under this topic
    const queries = db
      .select({ queryText: topicQueries.queryText })
      .from(topicQueries)
      .where(and(eq(topicQueries.topicId, topicId), eq(topicQueries.isActive, 1)))
      .orderBy(desc(topicQueries.priority), asc(topicQueries.id))
      .all();

    const allVideos: FoundVideo[] = [];
    for (const q of queries) {
      const found = await searchNewVideos(q.queryText, publishedAfter);
      logger.info({ query: q.queryText, count: found.length }, 'YouTube search done');
      allVideos.push(...found);
    }

    // Deduplicate by videoId, keeping first occurrence (highest-priority query)
    const byId = new Map<string, FoundVideo>();
    for (const v of allVideos) {
      if (!byId.has(v.videoId)) byId.set(v.videoId, v);
    }
    const unique = [...byId.values()];

    // Log every discovered video
    for (const video of unique) {
      logger.info(
        {
          videoId: video.videoId,
          title: video.title,
          channel: video.channelTitle,
          publishedAt: video.publishedAt,
          query: video.queryText,
          url: video.url,
        },
        'Found video',
      );
    }

    // Persist all discovered videos
    for (const video of unique) {
      upsertVideo(video);
      attachRunVideo(runId, topicId, video);
    }
    logger.info({ discovered: unique.length }, 'Videos persisted');

    // Rule-rank and take top candidates for LLM scoring
    const ruleRanked: ScoredVideo[] = unique
      .map((v) => ({
        ...v,
        ruleScore: scoreByRules({
          title: v.title,
          description: v.description,
          publishedAt: v.publishedAt,
          queryText: v.queryText,
          channelPreference: 0,
          keywordPreference: 0,
        }),
      }))
      .sort((a, b) => b.ruleScore - a.ruleScore)
      .slice(0, RULE_SHORTLIST);

    logger.info(
      { shortlistCount: ruleRanked.length, droppedCount: unique.length - ruleRanked.length },
      'Rule shortlist ready',
    );
    for (const v of ruleRanked) {
      logger.debug({ ruleScore: v.ruleScore, title: v.title, channel: v.channelTitle }, 'Shortlisted video');
    }

    // LLM-assess the shortlist
    const enriched: EnrichedVideo[] = [];
    for (const video of ruleRanked) {
      const assessment = await assessVideo({
        searchContext: `${topicName} — ${video.queryText}`,
        title: video.title,
        description: video.description,
        channelTitle: video.channelTitle,
      });

      if (!assessment.isEnglish) {
        logger.info({ title: video.title, channel: video.channelTitle }, 'Rejected non-English video');
        continue;
      }

      const finalScore = video.ruleScore * RULE_WEIGHT + assessment.relevanceScore * LLM_WEIGHT;

      logger.info(
        {
          title: video.title,
          ruleScore: video.ruleScore.toFixed(3),
          llmScore: assessment.relevanceScore,
          finalScore: finalScore.toFixed(3),
        },
        'Video scored',
      );

      db.update(runVideos)
        .set({
          ruleScore: video.ruleScore,
          llmScore: assessment.relevanceScore,
          finalScore,
          reason: assessment.reason,
          summary: assessment.summary,
        })
        .where(
          and(
            eq(runVideos.runId, runId),
            eq(runVideos.topicId, topicId),
            eq(runVideos.videoId, video.videoId),
          ),
        )
        .run();

      enriched.push({ ...video, llmScore: assessment.relevanceScore, finalScore, summary: assessment.summary, reason: assessment.reason });
    }

    // Select top videos for the digest email
    const top = enriched.sort((a, b) => b.finalScore - a.finalScore).slice(0, EMAIL_TOP);
    logger.info(
      { topCount: top.length, titles: top.map((v) => v.title) },
      'Top videos selected for digest',
    );

    for (let i = 0; i < top.length; i++) {
      db.update(runVideos)
        .set({ includedInEmail: 1, rankPosition: i + 1 })
        .where(
          and(
            eq(runVideos.runId, runId),
            eq(runVideos.topicId, topicId),
            eq(runVideos.videoId, top[i]!.videoId),
          ),
        )
        .run();
    }

    // Render and save HTML
    const dateStr = new Date().toISOString().slice(0, 10);
    const topicSlug = topicName.toLowerCase().replace(/\s+/g, '-');
    const htmlPath = `${REPORTS_DIR}/${dateStr}/${topicSlug}.html`;

    const html = renderDigest({
      dateLabel: new Date().toLocaleString(),
      topicName,
      videos: top.map((v) => ({
        videoId: v.videoId,
        title: v.title,
        channelTitle: v.channelTitle,
        publishedAt: v.publishedAt,
        url: v.url,
        summary: v.summary,
        reason: v.reason,
        thumbnailUrl: v.thumbnailUrl,
        ratingLinks: {
          love: `${env.APP_BASE_URL}/rate?topicId=${topicId}&videoId=${v.videoId}&rating=5`,
          good: `${env.APP_BASE_URL}/rate?topicId=${topicId}&videoId=${v.videoId}&rating=4`,
          meh: `${env.APP_BASE_URL}/rate?topicId=${topicId}&videoId=${v.videoId}&rating=3`,
          bad: `${env.APP_BASE_URL}/rate?topicId=${topicId}&videoId=${v.videoId}&rating=1`,
        },
      })),
    });

    await Bun.write(htmlPath, html);
    logger.info({ htmlPath }, 'Digest HTML saved');

    await sendDigestEmail(`${topicName} daily digest`, html);
    logger.info({ topicName }, 'Digest email sent');

    db.update(runs)
      .set({
        finishedAt: new Date().toISOString(),
        status: 'success',
        discoveredCount: unique.length,
        shortlistedCount: ruleRanked.length,
        emailedCount: top.length,
        htmlPath,
      })
      .where(eq(runs.id, runId))
      .run();

    logger.info({ runId, topicId }, 'Run complete');
  } catch (err) {
    logger.error({ runId, topicId, err }, 'Run failed');

    db.update(runs)
      .set({ finishedAt: new Date().toISOString(), status: 'failed' })
      .where(eq(runs.id, runId))
      .run();

    throw err;
  }
}
