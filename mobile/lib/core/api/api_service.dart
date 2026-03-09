import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:youtube_daily_digest/core/api/api_client.dart';
import 'package:youtube_daily_digest/features/topics/models/topic.dart';
import 'package:youtube_daily_digest/features/videos/models/video.dart';

final dioProvider = Provider<Dio>((ref) => createDioClient());

final apiServiceProvider = Provider<ApiService>((ref) {
  return ApiService(ref.watch(dioProvider));
});

class ApiService {
  final Dio _dio;

  ApiService(this._dio);

  // ── Topics ────────────────────────────────────────────────────────────────

  Future<List<Topic>> getTopics() async {
    final response = await _dio.get<List<dynamic>>('/topics');
    final data = response.data ?? [];
    return data
        .map((item) => Topic.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<Topic> createTopic(String name) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/topics',
      data: {'name': name},
    );
    return Topic.fromJson(response.data!);
  }

  Future<Map<String, dynamic>> runTopicSearch(int topicId) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/topics/$topicId/search',
    );
    return response.data!;
  }

  // ── Queries ───────────────────────────────────────────────────────────────

  Future<TopicQuery> createQuery({
    required int topicId,
    required String queryText,
    required int priority,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/topics/$topicId/queries',
      data: {'queryText': queryText, 'priority': priority},
    );
    return TopicQuery.fromJson(response.data!);
  }

  Future<TopicQuery> updateQuery({
    required int queryId,
    required String queryText,
    required int priority,
  }) async {
    final response = await _dio.put<Map<String, dynamic>>(
      '/queries/$queryId',
      data: {'queryText': queryText, 'priority': priority},
    );
    return TopicQuery.fromJson(response.data!);
  }

  Future<TopicQuery> toggleQuery({
    required int queryId,
    required bool isActive,
  }) async {
    final response = await _dio.patch<Map<String, dynamic>>(
      '/queries/$queryId/toggle',
      data: {'isActive': isActive ? 1 : 0},
    );
    return TopicQuery.fromJson(response.data!);
  }

  Future<void> deleteQuery(int queryId) async {
    await _dio.delete<void>('/queries/$queryId');
  }

  // ── Videos ────────────────────────────────────────────────────────────────

  Future<VideosResponse> getVideos({
    int page = 1,
    int pageSize = 50,
    String? date,
    String? search,
  }) async {
    final queryParams = <String, dynamic>{
      'page': page,
      'pageSize': pageSize,
    };
    if (date != null && date.isNotEmpty) queryParams['date'] = date;
    if (search != null && search.isNotEmpty) queryParams['search'] = search;

    final response = await _dio.get<Map<String, dynamic>>(
      '/videos',
      queryParameters: queryParams,
    );
    return VideosResponse.fromJson(response.data!);
  }
}
