import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:youtube_daily_digest/features/topics/models/topic.dart';
import 'package:youtube_daily_digest/features/topics/providers/topics_provider.dart';
import 'package:youtube_daily_digest/features/topics/widgets/query_tile.dart';
import 'package:youtube_daily_digest/shared/theme.dart';

class TopicCard extends ConsumerStatefulWidget {
  final Topic topic;

  const TopicCard({super.key, required this.topic});

  @override
  ConsumerState<TopicCard> createState() => _TopicCardState();
}

class _TopicCardState extends ConsumerState<TopicCard> {
  bool _expanded = false;
  bool _showAddQuery = false;
  bool _isRunning = false;
  final _queryController = TextEditingController();
  int _queryPriority = 1;
  bool _isAddingQuery = false;

  @override
  void dispose() {
    _queryController.dispose();
    super.dispose();
  }

  Color get _statusColor {
    final status = widget.topic.lastRun?.status;
    switch (status) {
      case 'success':
        return kSuccessGreen;
      case 'running':
        return kWarningYellow;
      case 'error':
        return kDangerRed;
      default:
        return kMutedGray;
    }
  }

  String get _statusLabel {
    final status = widget.topic.lastRun?.status;
    if (status == null) return 'Never run';
    return status[0].toUpperCase() + status.substring(1);
  }

  String get _lastRunTime {
    final startedAt = widget.topic.lastRun?.startedAt;
    if (startedAt == null || startedAt.isEmpty) return '';
    try {
      final dt = DateTime.parse(startedAt).toLocal();
      return DateFormat('MMM d, h:mm a').format(dt);
    } catch (_) {
      return startedAt;
    }
  }

  Future<void> _runSearch() async {
    setState(() => _isRunning = true);
    try {
      await ref.read(topicsProvider.notifier).runSearch(widget.topic.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Search started successfully'),
            backgroundColor: kSuccessGreen,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to run search: $e'),
            backgroundColor: kDangerRed,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isRunning = false);
    }
  }

  Future<void> _addQuery() async {
    final text = _queryController.text.trim();
    if (text.isEmpty) return;
    setState(() => _isAddingQuery = true);
    try {
      await ref.read(topicsProvider.notifier).addQuery(
            topicId: widget.topic.id,
            queryText: text,
            priority: _queryPriority,
          );
      _queryController.clear();
      if (mounted) setState(() => _showAddQuery = false);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to add query: $e'),
            backgroundColor: kDangerRed,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isAddingQuery = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final topic = widget.topic;
    final isActive = topic.isActive == 1;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          // ── Header ──────────────────────────────────────────────────────
          InkWell(
            onTap: () => setState(() => _expanded = !_expanded),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      // Expand icon
                      Icon(
                        _expanded ? Icons.expand_less : Icons.expand_more,
                        color: kMutedGray,
                        size: 20,
                      ),
                      const SizedBox(width: 6),
                      // Topic name
                      Expanded(
                        child: Text(
                          topic.name,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      // Video count badge
                      _badge(
                        '${topic.videoCount} videos',
                        Colors.blue.shade700,
                        Colors.blue.shade50,
                      ),
                      const SizedBox(width: 6),
                      // Active badge
                      _badge(
                        isActive ? 'Active' : 'Inactive',
                        isActive ? kSuccessGreen : kMutedGray,
                        isActive
                            ? kSuccessGreen.withAlpha(26)
                            : Colors.grey.shade100,
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const SizedBox(width: 26),
                      // Status indicator
                      Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: _statusColor,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        _statusLabel,
                        style: TextStyle(
                          fontSize: 12,
                          color: _statusColor,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      if (_lastRunTime.isNotEmpty) ...[
                        Text(
                          ' · $_lastRunTime',
                          style: const TextStyle(
                            fontSize: 12,
                            color: kMutedGray,
                          ),
                        ),
                      ],
                      const Spacer(),
                      // Run search button
                      SizedBox(
                        height: 30,
                        child: ElevatedButton.icon(
                          onPressed: _isRunning ? null : _runSearch,
                          icon: _isRunning
                              ? const SizedBox(
                                  width: 12,
                                  height: 12,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : const Icon(Icons.search, size: 14),
                          label: const Text(
                            'Run Search',
                            style: TextStyle(fontSize: 12),
                          ),
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 10),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // ── Expanded: Query list ─────────────────────────────────────────
          if (_expanded) ...[
            const Divider(height: 1),
            if (topic.queries.isEmpty)
              const Padding(
                padding: EdgeInsets.all(16),
                child: Text(
                  'No queries yet. Add one below.',
                  style: TextStyle(color: kMutedGray, fontSize: 13),
                ),
              )
            else
              Column(
                children: topic.queries
                    .map((q) => QueryTile(query: q, topicId: topic.id))
                    .toList(),
              ),

            // ── Add query form ──────────────────────────────────────────
            if (_showAddQuery)
              Container(
                color: Colors.grey.shade50,
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TextField(
                      controller: _queryController,
                      autofocus: true,
                      decoration: const InputDecoration(
                        labelText: 'Query text',
                        hintText: 'e.g. "flutter tutorial 2024"',
                      ),
                      onSubmitted: (_) => _addQuery(),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Text('Priority: ', style: TextStyle(fontSize: 13)),
                        DropdownButton<int>(
                          value: _queryPriority,
                          isDense: true,
                          items: List.generate(
                            5,
                            (i) => DropdownMenuItem(
                              value: i + 1,
                              child: Text('P${i + 1}'),
                            ),
                          ),
                          onChanged: (v) {
                            if (v != null) {
                              setState(() => _queryPriority = v);
                            }
                          },
                        ),
                        const Spacer(),
                        TextButton(
                          onPressed: () {
                            _queryController.clear();
                            setState(() => _showAddQuery = false);
                          },
                          child: const Text('Cancel'),
                        ),
                        const SizedBox(width: 8),
                        ElevatedButton(
                          onPressed: _isAddingQuery ? null : _addQuery,
                          child: _isAddingQuery
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : const Text('Add'),
                        ),
                      ],
                    ),
                  ],
                ),
              )
            else
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: TextButton.icon(
                    onPressed: () => setState(() => _showAddQuery = true),
                    icon: const Icon(Icons.add, size: 16),
                    label: const Text('Add Query'),
                    style: TextButton.styleFrom(
                      foregroundColor: kPrimaryRed,
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                    ),
                  ),
                ),
              ),
          ],
        ],
      ),
    );
  }

  Widget _badge(String label, Color fg, Color bg) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          color: fg,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
