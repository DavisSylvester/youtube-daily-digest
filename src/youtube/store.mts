import { db } from '../repository/db.mts';
import { videos, runVideos } from '../repository/schema.mts';
import { sql } from 'drizzle-orm';
import type { FoundVideo } from './fetch.mts';

export function upsertVideo(video: FoundVideo): void {
  db.insert(videos)
    .values({
      videoId: video.videoId,
      title: video.title,
      channelId: video.channelId ?? null,
      channelTitle: video.channelTitle ?? null,
      publishedAt: video.publishedAt,
      url: video.url,
      description: video.description,
      thumbnailUrl: video.thumbnailUrl ?? null,
      firstSeenAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      isShort: video.isShort ? 1 : 0,
    })
    .onConflictDoUpdate({
      target: videos.videoId,
      set: {
        title: sql`excluded.title`,
        channelId: sql`excluded.channel_id`,
        channelTitle: sql`excluded.channel_title`,
        publishedAt: sql`excluded.published_at`,
        url: sql`excluded.url`,
        description: sql`excluded.description`,
        thumbnailUrl: sql`excluded.thumbnail_url`,
        isShort: sql`excluded.is_short`,
      },
    })
    .run();
}

export function attachRunVideo(
  runId: string,
  topicId: number,
  video: FoundVideo,
): void {
  db.insert(runVideos)
    .values({
      runId,
      topicId,
      videoId: video.videoId,
      queryText: video.queryText,
    })
    .onConflictDoNothing()
    .run();
}
