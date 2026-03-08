import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:youtube_daily_digest/features/videos/providers/videos_provider.dart';
import 'package:youtube_daily_digest/features/videos/widgets/video_tile.dart';
import 'package:youtube_daily_digest/shared/theme.dart';

class VideosScreen extends ConsumerStatefulWidget {
  const VideosScreen({super.key});

  @override
  ConsumerState<VideosScreen> createState() => _VideosScreenState();
}

class _VideosScreenState extends ConsumerState<VideosScreen> {
  final _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  String get _todayString => DateFormat('yyyy-MM-dd').format(DateTime.now());

  void _setToday() {
    ref.read(videoFilterProvider.notifier).update(
          (f) => f.copyWith(date: _todayString, page: 1),
        );
  }

  void _clearDateFilter() {
    ref.read(videoFilterProvider.notifier).update(
          (f) => f.copyWith(clearDate: true, page: 1),
        );
  }

  Future<void> _pickDate(BuildContext context) async {
    final filter = ref.read(videoFilterProvider);
    DateTime initial;
    try {
      initial =
          filter.date != null ? DateTime.parse(filter.date!) : DateTime.now();
    } catch (_) {
      initial = DateTime.now();
    }

    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(const Duration(days: 1)),
    );
    if (picked != null) {
      final dateStr = DateFormat('yyyy-MM-dd').format(picked);
      ref.read(videoFilterProvider.notifier).update(
            (f) => f.copyWith(date: dateStr, page: 1),
          );
    }
  }

  void _applySearch(String value) {
    ref.read(videoFilterProvider.notifier).update(
          (f) => value.trim().isEmpty
              ? f.copyWith(clearSearch: true, page: 1)
              : f.copyWith(search: value.trim(), page: 1),
        );
  }

  void _goToPage(int page) {
    ref.read(videoFilterProvider.notifier).update(
          (f) => f.copyWith(page: page),
        );
  }

  @override
  Widget build(BuildContext context) {
    final filter = ref.watch(videoFilterProvider);
    final videosAsync = ref.watch(videosProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Videos'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(videosProvider),
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: Column(
        children: [
          // ── Filters bar ─────────────────────────────────────────────────
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
            child: Column(
              children: [
                // Search field
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Search by title or channel...',
                    prefixIcon: const Icon(Icons.search, size: 20),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, size: 18),
                            onPressed: () {
                              _searchController.clear();
                              _applySearch('');
                            },
                          )
                        : null,
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 10,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  onChanged: (v) {
                    setState(() {});
                    _applySearch(v);
                  },
                ),
                const SizedBox(height: 8),
                // Date filter row
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      // Date picker button
                      OutlinedButton.icon(
                        onPressed: () => _pickDate(context),
                        icon: const Icon(Icons.calendar_month, size: 16),
                        label: Text(
                          filter.date ?? 'All Dates',
                          style: const TextStyle(fontSize: 13),
                        ),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 6,
                          ),
                          side: BorderSide(
                            color: filter.date != null
                                ? kPrimaryRed
                                : Colors.grey.shade400,
                          ),
                          foregroundColor:
                              filter.date != null ? kPrimaryRed : kMutedGray,
                        ),
                      ),
                      const SizedBox(width: 8),
                      // Today button
                      _filterChip(
                        label: 'Today',
                        selected: filter.date == _todayString,
                        onTap: _setToday,
                      ),
                      const SizedBox(width: 6),
                      // All Dates button
                      _filterChip(
                        label: 'All Dates',
                        selected: filter.date == null,
                        onTap: _clearDateFilter,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // ── Video list ───────────────────────────────────────────────────
          Expanded(
            child: videosAsync.when(
              loading: () =>
                  const Center(child: CircularProgressIndicator()),
              error: (error, stack) => _ErrorView(
                error: error.toString(),
                onRetry: () => ref.invalidate(videosProvider),
              ),
              data: (response) {
                if (response.videos.isEmpty) {
                  return const _EmptyView();
                }
                return RefreshIndicator(
                  onRefresh: () async => ref.invalidate(videosProvider),
                  child: Column(
                    children: [
                      // Results summary
                      Padding(
                        padding: const EdgeInsets.fromLTRB(12, 8, 12, 4),
                        child: Row(
                          children: [
                            Text(
                              '${response.total} videos',
                              style: const TextStyle(
                                fontSize: 13,
                                color: kMutedGray,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            if (filter.date != null) ...[
                              const Text(
                                ' for ',
                                style: TextStyle(
                                    fontSize: 13, color: kMutedGray),
                              ),
                              Text(
                                filter.date!,
                                style: const TextStyle(
                                  fontSize: 13,
                                  color: kPrimaryRed,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                      // List
                      Expanded(
                        child: ListView.builder(
                          padding: const EdgeInsets.only(bottom: 8),
                          itemCount: response.videos.length,
                          itemBuilder: (context, index) {
                            return VideoTile(video: response.videos[index]);
                          },
                        ),
                      ),
                      // Pagination
                      if (response.totalPages > 1)
                        _PaginationBar(
                          response: response,
                          onPageChanged: _goToPage,
                        ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _filterChip({
    required String label,
    required bool selected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: selected ? kPrimaryRed : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: selected ? kPrimaryRed : Colors.grey.shade300,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            color: selected ? Colors.white : kMutedGray,
            fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
          ),
        ),
      ),
    );
  }
}

class _PaginationBar extends StatelessWidget {
  final dynamic response;
  final void Function(int) onPageChanged;

  const _PaginationBar({
    required this.response,
    required this.onPageChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          IconButton(
            icon: const Icon(Icons.chevron_left),
            onPressed: response.hasPrevPage
                ? () => onPageChanged(response.page - 1)
                : null,
            tooltip: 'Previous page',
          ),
          const SizedBox(width: 8),
          Text(
            'Page ${response.page} of ${response.totalPages}',
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
          ),
          const SizedBox(width: 8),
          IconButton(
            icon: const Icon(Icons.chevron_right),
            onPressed: response.hasNextPage
                ? () => onPageChanged(response.page + 1)
                : null,
            tooltip: 'Next page',
          ),
        ],
      ),
    );
  }
}

class _EmptyView extends StatelessWidget {
  const _EmptyView();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.video_library_outlined,
              size: 64, color: Colors.grey.shade400),
          const SizedBox(height: 16),
          Text(
            'No videos found',
            style: TextStyle(
              fontSize: 18,
              color: Colors.grey.shade600,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Try a different date or search term',
            style: TextStyle(color: Colors.grey.shade500),
          ),
        ],
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;

  const _ErrorView({required this.error, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: kDangerRed),
            const SizedBox(height: 16),
            const Text(
              'Failed to load videos',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: kDangerRed,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              error,
              textAlign: TextAlign.center,
              style: const TextStyle(color: kMutedGray, fontSize: 13),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}
