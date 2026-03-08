import { google, type youtube_v3 } from 'googleapis';
import { env } from '../env.mts';

const youtube = google.youtube({
  version: 'v3',
  auth: env.YOUTUBE_API_KEY,
});

export interface FoundVideo {
  readonly videoId: string;
  readonly title: string;
  readonly description: string;
  readonly channelId?: string;
  readonly channelTitle?: string;
  readonly publishedAt: string;
  readonly thumbnailUrl?: string;
  readonly url: string;
  readonly queryText: string;
  readonly isShort: boolean;
}

interface SearchPage {
  readonly items: youtube_v3.Schema$SearchResult[];
  readonly nextPageToken: string | undefined;
}

function parseIsoDurationSeconds(duration: string): number {
  const m = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] ?? '0', 10) * 3600)
    + (parseInt(m[2] ?? '0', 10) * 60)
    + parseInt(m[3] ?? '0', 10);
}

async function fetchPage(
  queryText: string,
  publishedAfter: string,
  pageToken: string | undefined,
): Promise<SearchPage> {
  const res = await youtube.search.list({
    part: ['snippet'],
    q: queryText,
    type: ['video'],
    order: 'date',
    maxResults: 25,
    publishedAfter,
    pageToken,
  });
  return {
    items: res.data.items ?? [],
    nextPageToken: res.data.nextPageToken ?? undefined,
  };
}

async function detectShorts(videoIds: readonly string[]): Promise<Set<string>> {
  const shorts = new Set<string>();
  const batchSize = 50;
  for (let i = 0; i < videoIds.length; i += batchSize) {
    const batch = videoIds.slice(i, i + batchSize);
    try {
      const res = await youtube.videos.list({ part: ['contentDetails'], id: batch });
      for (const item of res.data.items ?? []) {
        if (!item.id || !item.contentDetails?.duration) continue;
        const secs = parseIsoDurationSeconds(item.contentDetails.duration);
        if (secs > 0 && secs <= 60) shorts.add(item.id);
      }
    } catch {
      // If contentDetails call fails, fall through — videos won't be marked as shorts
    }
  }
  return shorts;
}

export async function searchNewVideos(
  queryText: string,
  publishedAfter: string,
): Promise<FoundVideo[]> {
  const results: FoundVideo[] = [];
  let pageToken: string | undefined = undefined;

  for (let page = 0; page < 2; page++) {
    const { items, nextPageToken } = await fetchPage(queryText, publishedAfter, pageToken);

    for (const item of items) {
      const videoId = item.id?.videoId;
      const snippet = item.snippet;
      if (!videoId || !snippet?.publishedAt || !snippet.title) continue;

      results.push({
        videoId,
        title: snippet.title,
        description: snippet.description ?? '',
        channelId: snippet.channelId ?? undefined,
        channelTitle: snippet.channelTitle ?? undefined,
        publishedAt: snippet.publishedAt,
        thumbnailUrl: snippet.thumbnails?.medium?.url ?? undefined,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        queryText,
        isShort: false, // resolved below
      });
    }

    pageToken = nextPageToken;
    if (!pageToken) break;
  }

  if (results.length === 0) return results;

  // Detect Shorts: check #shorts tag first (no quota cost), then verify duration via API
  const shortsByDuration = await detectShorts(results.map((v) => v.videoId));

  return results.map((v) => ({
    ...v,
    isShort:
      shortsByDuration.has(v.videoId) ||
      /\#shorts?\b/i.test(`${v.title} ${v.description}`),
  }));
}
