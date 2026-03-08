import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:youtube_daily_digest/features/topics/models/topic.dart';
import 'package:youtube_daily_digest/features/topics/providers/topics_provider.dart';
import 'package:youtube_daily_digest/shared/theme.dart';

class QueryTile extends ConsumerStatefulWidget {
  final TopicQuery query;
  final int topicId;

  const QueryTile({super.key, required this.query, required this.topicId});

  @override
  ConsumerState<QueryTile> createState() => _QueryTileState();
}

class _QueryTileState extends ConsumerState<QueryTile> {
  bool _isEditing = false;
  final _editController = TextEditingController();
  int _editPriority = 1;
  bool _isBusy = false;

  @override
  void dispose() {
    _editController.dispose();
    super.dispose();
  }

  Future<void> _toggleActive() async {
    setState(() => _isBusy = true);
    try {
      await ref.read(topicsProvider.notifier).toggleQuery(
            topicId: widget.topicId,
            queryId: widget.query.id,
            isActive: widget.query.isActive != 1,
          );
    } catch (e) {
      if (mounted) _showError('Failed to toggle query: $e');
    } finally {
      if (mounted) setState(() => _isBusy = false);
    }
  }

  Future<void> _saveEdit() async {
    final text = _editController.text.trim();
    if (text.isEmpty) return;
    setState(() => _isBusy = true);
    try {
      await ref.read(topicsProvider.notifier).updateQuery(
            topicId: widget.topicId,
            queryId: widget.query.id,
            queryText: text,
            priority: _editPriority,
          );
      if (mounted) setState(() => _isEditing = false);
    } catch (e) {
      if (mounted) _showError('Failed to update query: $e');
    } finally {
      if (mounted) setState(() => _isBusy = false);
    }
  }

  Future<void> _delete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Query'),
        content:
            Text('Delete "${widget.query.queryText}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: kDangerRed),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    setState(() => _isBusy = true);
    try {
      await ref.read(topicsProvider.notifier).deleteQuery(
            topicId: widget.topicId,
            queryId: widget.query.id,
          );
    } catch (e) {
      if (mounted) _showError('Failed to delete query: $e');
      if (mounted) setState(() => _isBusy = false);
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: kDangerRed),
    );
  }

  void _startEdit() {
    _editController.text = widget.query.queryText;
    _editPriority = widget.query.priority;
    setState(() => _isEditing = true);
  }

  @override
  Widget build(BuildContext context) {
    final isActive = widget.query.isActive == 1;

    if (_isEditing) {
      return _buildEditMode();
    }

    return Container(
      decoration: BoxDecoration(
        color: isActive ? Colors.white : Colors.grey.shade50,
        border: Border(
          bottom: BorderSide(color: Colors.grey.shade200),
        ),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: [
          // Priority badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: _priorityColor(widget.query.priority),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              'P${widget.query.priority}',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 11,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 10),
          // Query text
          Expanded(
            child: Text(
              widget.query.queryText,
              style: TextStyle(
                fontSize: 14,
                color: isActive ? Colors.black87 : kMutedGray,
                decoration: isActive ? null : TextDecoration.lineThrough,
              ),
            ),
          ),
          // Active badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: isActive
                  ? kSuccessGreen.withAlpha(26)
                  : Colors.grey.shade200,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              isActive ? 'Active' : 'Paused',
              style: TextStyle(
                fontSize: 11,
                color: isActive ? kSuccessGreen : kMutedGray,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          const SizedBox(width: 4),
          // Actions
          if (_isBusy)
            const SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          else ...[
            IconButton(
              icon: Icon(
                isActive ? Icons.pause_circle_outline : Icons.play_circle_outline,
                size: 20,
                color: isActive ? kWarningYellow : kSuccessGreen,
              ),
              onPressed: _toggleActive,
              tooltip: isActive ? 'Pause' : 'Activate',
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
            ),
            IconButton(
              icon: const Icon(Icons.edit_outlined, size: 18, color: kMutedGray),
              onPressed: _startEdit,
              tooltip: 'Edit',
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
            ),
            IconButton(
              icon: const Icon(Icons.delete_outline, size: 18, color: kDangerRed),
              onPressed: _delete,
              tooltip: 'Delete',
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildEditMode() {
    return Container(
      color: Colors.blue.shade50,
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            controller: _editController,
            autofocus: true,
            decoration: const InputDecoration(
              labelText: 'Query text',
              hintText: 'Enter search query',
            ),
            onSubmitted: (_) => _saveEdit(),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Text('Priority: ', style: TextStyle(fontSize: 13)),
              DropdownButton<int>(
                value: _editPriority,
                isDense: true,
                items: List.generate(
                  5,
                  (i) => DropdownMenuItem(
                    value: i + 1,
                    child: Text('P${i + 1}'),
                  ),
                ),
                onChanged: (v) {
                  if (v != null) setState(() => _editPriority = v);
                },
              ),
              const Spacer(),
              TextButton(
                onPressed: () => setState(() => _isEditing = false),
                child: const Text('Cancel'),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: _isBusy ? null : _saveEdit,
                child: _isBusy
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Save'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Color _priorityColor(int priority) {
    switch (priority) {
      case 1:
        return Colors.red.shade600;
      case 2:
        return Colors.orange.shade600;
      case 3:
        return Colors.blue.shade600;
      case 4:
        return Colors.teal.shade600;
      default:
        return Colors.grey.shade600;
    }
  }
}
