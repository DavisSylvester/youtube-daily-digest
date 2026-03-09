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
  readonly defaultLanguage: string;
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
    relevanceLanguage: 'en',
  });
  return {
    items: res.data.items ?? [],
    nextPageToken: res.data.nextPageToken ?? undefined,
  };
}

interface VideoDetails {
  isShort: boolean;
  defaultLanguage: string;
}

async function fetchVideoDetails(
  videoIds: readonly string[],
): Promise<Map<string, VideoDetails>> {
  const result = new Map<string, VideoDetails>();
  const batchSize = 50;

  for (let i = 0; i < videoIds.length; i += batchSize) {
    const batch = videoIds.slice(i, i + batchSize);
    try {
      const res = await youtube.videos.list({
        part: ['contentDetails', 'snippet'],
        id: batch,
      });
      for (const item of res.data.items ?? []) {
        if (!item.id) continue;
        const secs = item.contentDetails?.duration
          ? parseIsoDurationSeconds(item.contentDetails.duration)
          : 0;
        const isShort = secs > 0 && secs <= 60;
        const lang = (
          item.snippet?.defaultAudioLanguage ??
          item.snippet?.defaultLanguage ??
          ''
        ).toLowerCase();
        result.set(item.id, { isShort, defaultLanguage: lang });
      }
    } catch {
      // batch failed — mark unknown
    }
  }
  return result;
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
        isShort: false,
        defaultLanguage: '',
      });
    }

    pageToken = nextPageToken;
    if (!pageToken) break;
  }

  if (results.length === 0) return results;

  const detailsMap = await fetchVideoDetails(results.map((v) => v.videoId));

  return results.map((v) => {
    const details = detailsMap.get(v.videoId);
    const lang = details?.defaultLanguage ?? '';
    const isShortByDuration = details?.isShort ?? false;
    const isShortByTag = /\#shorts?\b/i.test(`${v.title} ${v.description}`);
    return {
      ...v,
      isShort: isShortByDuration || isShortByTag,
      defaultLanguage: lang,
    };
  });
}
