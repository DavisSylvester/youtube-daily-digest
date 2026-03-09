import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:youtube_daily_digest/core/api/api_service.dart';
import 'package:youtube_daily_digest/features/videos/models/video.dart';

// ── Filter state ──────────────────────────────────────────────────────────

class VideoFilter {
  final int page;
  final int pageSize;
  final String? date;
  final String? search;

  const VideoFilter({
    this.page = 1,
    this.pageSize = 50,
    this.date,
    this.search,
  });

  VideoFilter copyWith({
    int? page,
    int? pageSize,
    String? date,
    bool clearDate = false,
    String? search,
    bool clearSearch = false,
  }) {
    return VideoFilter(
      page: page ?? this.page,
      pageSize: pageSize ?? this.pageSize,
      date: clearDate ? null : (date ?? this.date),
      search: clearSearch ? null : (search ?? this.search),
    );
  }
}

final videoFilterProvider = StateProvider<VideoFilter>((ref) {
  final today = DateFormat('yyyy-MM-dd').format(DateTime.now());
  return VideoFilter(date: today);
});

// ── Videos async state ────────────────────────────────────────────────────

final videosProvider = FutureProvider.autoDispose<VideosResponse>((ref) async {
  final filter = ref.watch(videoFilterProvider);
  final service = ref.watch(apiServiceProvider);
  return service.getVideos(
    page: filter.page,
    pageSize: filter.pageSize,
    date: filter.date,
    search: filter.search,
  );
});
