import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { Topic, TopicQuery, VideosResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/v1';

  getTopics(): Observable<Topic[]> {
    return this.http.get<Topic[]>(`${this.base}/topics`);
  }

  createTopic(name: string): Observable<Omit<Topic, 'queries' | 'videoCount'>> {
    return this.http.post<Omit<Topic, 'queries' | 'videoCount'>>(`${this.base}/topics`, { name });
  }

  searchTopic(topicId: number): Observable<{ started: boolean; topicId: number }> {
    return this.http.post<{ started: boolean; topicId: number }>(
      `${this.base}/topics/${topicId}/search`,
      {},
    );
  }

  addQuery(topicId: number, queryText: string, priority: number): Observable<TopicQuery> {
    return this.http.post<TopicQuery>(`${this.base}/topics/${topicId}/queries`, {
      queryText,
      priority,
    });
  }

  updateQuery(queryId: number, queryText: string, priority: number): Observable<TopicQuery> {
    return this.http.put<TopicQuery>(`${this.base}/queries/${queryId}`, { queryText, priority });
  }

  deleteQuery(queryId: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.base}/queries/${queryId}`);
  }

  toggleQuery(queryId: number, isActive: number): Observable<TopicQuery> {
    return this.http.patch<TopicQuery>(`${this.base}/queries/${queryId}/toggle`, { isActive });
  }

  deleteVideo(videoId: string, reason: string): Observable<{ success: boolean; deletedVideoId: string }> {
    return this.http.delete<{ success: boolean; deletedVideoId: string }>(
      `${this.base}/videos/${encodeURIComponent(videoId)}`,
      { body: { reason } },
    );
  }

  getVideos(page = 1, pageSize = 50, date?: string, englishOnly = true): Observable<VideosResponse> {
    const params: Record<string, string> = {
      page: String(page),
      pageSize: String(pageSize),
      englishOnly: String(englishOnly),
    };
    if (date) params['date'] = date;
    return this.http.get<VideosResponse>(`${this.base}/videos`, { params });
  }
}
