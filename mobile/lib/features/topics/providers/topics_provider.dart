import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:youtube_daily_digest/core/api/api_service.dart';
import 'package:youtube_daily_digest/features/topics/models/topic.dart';

// ── Topics list state ─────────────────────────────────────────────────────

class TopicsNotifier extends AsyncNotifier<List<Topic>> {
  @override
  Future<List<Topic>> build() async {
    return ref.read(apiServiceProvider).getTopics();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(apiServiceProvider).getTopics(),
    );
  }

  Future<void> addTopic(String name) async {
    final service = ref.read(apiServiceProvider);
    final newTopic = await service.createTopic(name);
    state = state.whenData((topics) => [...topics, newTopic]);
  }

  Future<void> runSearch(int topicId) async {
    await ref.read(apiServiceProvider).runTopicSearch(topicId);
    // Refresh to pick up new run status
    await refresh();
  }

  Future<void> addQuery({
    required int topicId,
    required String queryText,
    required int priority,
  }) async {
    final service = ref.read(apiServiceProvider);
    final newQuery = await service.createQuery(
      topicId: topicId,
      queryText: queryText,
      priority: priority,
    );
    state = state.whenData((topics) {
      return topics.map((t) {
        if (t.id != topicId) return t;
        return t.copyWith(queries: [...t.queries, newQuery]);
      }).toList();
    });
  }

  Future<void> updateQuery({
    required int topicId,
    required int queryId,
    required String queryText,
    required int priority,
  }) async {
    final service = ref.read(apiServiceProvider);
    final updated = await service.updateQuery(
      queryId: queryId,
      queryText: queryText,
      priority: priority,
    );
    state = state.whenData((topics) {
      return topics.map((t) {
        if (t.id != topicId) return t;
        return t.copyWith(
          queries: t.queries.map((q) => q.id == queryId ? updated : q).toList(),
        );
      }).toList();
    });
  }

  Future<void> toggleQuery({
    required int topicId,
    required int queryId,
    required bool isActive,
  }) async {
    final service = ref.read(apiServiceProvider);
    final updated = await service.toggleQuery(
      queryId: queryId,
      isActive: isActive,
    );
    state = state.whenData((topics) {
      return topics.map((t) {
        if (t.id != topicId) return t;
        return t.copyWith(
          queries: t.queries.map((q) => q.id == queryId ? updated : q).toList(),
        );
      }).toList();
    });
  }

  Future<void> deleteQuery({
    required int topicId,
    required int queryId,
  }) async {
    final service = ref.read(apiServiceProvider);
    await service.deleteQuery(queryId);
    state = state.whenData((topics) {
      return topics.map((t) {
        if (t.id != topicId) return t;
        return t.copyWith(
          queries: t.queries.where((q) => q.id != queryId).toList(),
        );
      }).toList();
    });
  }
}

final topicsProvider =
    AsyncNotifierProvider<TopicsNotifier, List<Topic>>(TopicsNotifier.new);
