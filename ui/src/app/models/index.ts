export interface TopicLastRun {
  status: string;
  startedAt: string;
  finishedAt: string | null;
  discoveredCount: number;
}

export interface Topic {
  id: number;
  name: string;
  slug: string;
  isActive: number;
  createdAt: string;
  videoCount: number;
  lastRun: TopicLastRun | null;
  queries: TopicQuery[];
}

export interface TopicQuery {
  id: number;
  topicId: number;
  queryText: string;
  priority: number;
  isActive: number;
}

export interface Video {
  videoId: string;
  title: string;
  channelId: string | null;
  channelTitle: string | null;
  publishedAt: string;
  url: string;
  description: string | null;
  thumbnailUrl: string | null;
  firstSeenAt: string;
  isShort: number;
}

export interface VideosResponse {
  videos: Video[];
  total: number;
  page: number;
  pageSize: number;
}
