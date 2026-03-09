import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:youtube_daily_digest/features/topics/providers/topics_provider.dart';
import 'package:youtube_daily_digest/features/topics/widgets/topic_card.dart';
import 'package:youtube_daily_digest/shared/theme.dart';

class TopicsScreen extends ConsumerStatefulWidget {
  const TopicsScreen({super.key});

  @override
  ConsumerState<TopicsScreen> createState() => _TopicsScreenState();
}

class _TopicsScreenState extends ConsumerState<TopicsScreen> {
  bool _showAddTopic = false;
  final _topicNameController = TextEditingController();
  bool _isCreating = false;

  @override
  void dispose() {
    _topicNameController.dispose();
    super.dispose();
  }

  Future<void> _createTopic() async {
    final name = _topicNameController.text.trim();
    if (name.isEmpty) return;
    setState(() => _isCreating = true);
    try {
      await ref.read(topicsProvider.notifier).addTopic(name);
      _topicNameController.clear();
      if (mounted) setState(() => _showAddTopic = false);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to create topic: $e'),
            backgroundColor: kDangerRed,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isCreating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final topicsAsync = ref.watch(topicsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Search Queries'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.read(topicsProvider.notifier).refresh(),
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: Column(
        children: [
          // ── Add New Topic button / form ──────────────────────────────────
          if (_showAddTopic)
            _AddTopicForm(
              controller: _topicNameController,
              isCreating: _isCreating,
              onSave: _createTopic,
              onCancel: () {
                _topicNameController.clear();
                setState(() => _showAddTopic = false);
              },
            )
          else
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 6),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () => setState(() => _showAddTopic = true),
                  icon: const Icon(Icons.add),
                  label: const Text('Add New Topic'),
                ),
              ),
            ),

          // ── Topics list ──────────────────────────────────────────────────
          Expanded(
            child: topicsAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, stack) => _ErrorView(
                error: error.toString(),
                onRetry: () => ref.read(topicsProvider.notifier).refresh(),
              ),
              data: (topics) {
                if (topics.isEmpty) {
                  return const _EmptyView();
                }
                return RefreshIndicator(
                  onRefresh: () =>
                      ref.read(topicsProvider.notifier).refresh(),
                  child: ListView.builder(
                    padding: const EdgeInsets.only(bottom: 20),
                    itemCount: topics.length,
                    itemBuilder: (context, index) {
                      return TopicCard(topic: topics[index]);
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _AddTopicForm extends StatelessWidget {
  final TextEditingController controller;
  final bool isCreating;
  final VoidCallback onSave;
  final VoidCallback onCancel;

  const _AddTopicForm({
    required this.controller,
    required this.isCreating,
    required this.onSave,
    required this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.blue.shade50,
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'New Topic',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: controller,
            autofocus: true,
            decoration: const InputDecoration(
              labelText: 'Topic name',
              hintText: 'e.g. "Flutter Development"',
              filled: true,
              fillColor: Colors.white,
            ),
            onSubmitted: (_) => onSave(),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              TextButton(
                onPressed: onCancel,
                child: const Text('Cancel'),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: isCreating ? null : onSave,
                child: isCreating
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text('Create'),
              ),
            ],
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
          Icon(Icons.topic_outlined, size: 64, color: Colors.grey.shade400),
          const SizedBox(height: 16),
          Text(
            'No topics yet',
            style: TextStyle(
              fontSize: 18,
              color: Colors.grey.shade600,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Add a topic to get started',
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
              'Failed to load topics',
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
