import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:youtube_daily_digest/features/videos/models/video.dart';
import 'package:youtube_daily_digest/shared/theme.dart';

class VideoTile extends StatelessWidget {
  final Video video;

  const VideoTile({super.key, required this.video});

  Future<void> _openUrl() async {
    final uri = Uri.parse(video.youtubeUrl);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  String _formatDate(String dateStr) {
    if (dateStr.isEmpty) return '';
    try {
      final dt = DateTime.parse(dateStr).toLocal();
      return DateFormat('MMM d, yyyy').format(dt);
    } catch (_) {
      return dateStr;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      child: InkWell(
        onTap: _openUrl,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Thumbnail ──────────────────────────────────────────────
              Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: video.thumbnailUrl != null
                        ? CachedNetworkImage(
                            imageUrl: video.thumbnailUrl!,
                            width: 120,
                            height: 68,
                            fit: BoxFit.cover,
                            placeholder: (context, url) => Container(
                              width: 120,
                              height: 68,
                              color: Colors.grey.shade200,
                              child: const Icon(
                                Icons.play_circle_outline,
                                color: Colors.grey,
                              ),
                            ),
                            errorWidget: (context, url, error) => Container(
                              width: 120,
                              height: 68,
                              color: Colors.grey.shade200,
                              child: const Icon(
                                Icons.broken_image_outlined,
                                color: Colors.grey,
                              ),
                            ),
                          )
                        : Container(
                            width: 120,
                            height: 68,
                            decoration: BoxDecoration(
                              color: Colors.grey.shade200,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Icon(
                              Icons.play_circle_outline,
                              color: Colors.grey,
                            ),
                          ),
                  ),
                  // Short badge overlay
                  if (video.isShortVideo)
                    Positioned(
                      top: 4,
                      left: 4,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 4,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: kDangerRed,
                          borderRadius: BorderRadius.circular(3),
                        ),
                        child: const Text(
                          'Short',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                ],
              ),

              const SizedBox(width: 10),

              // ── Text content ───────────────────────────────────────────
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title
                    Text(
                      video.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        height: 1.3,
                      ),
                    ),
                    const SizedBox(height: 4),
                    // Channel
                    if (video.channelTitle != null &&
                        video.channelTitle!.isNotEmpty)
                      Text(
                        video.channelTitle!,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 12,
                          color: kMutedGray,
                        ),
                      ),
                    const SizedBox(height: 4),
                    // Dates row
                    Wrap(
                      spacing: 8,
                      runSpacing: 2,
                      children: [
                        _dateChip(
                          Icons.calendar_today_outlined,
                          _formatDate(video.publishedAt),
                          'Published',
                        ),
                        _dateChip(
                          Icons.visibility_outlined,
                          _formatDate(video.firstSeenAt),
                          'First seen',
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // ── Open icon ──────────────────────────────────────────────
              const Icon(
                Icons.open_in_new,
                size: 14,
                color: kMutedGray,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _dateChip(IconData icon, String label, String tooltip) {
    if (label.isEmpty) return const SizedBox.shrink();
    return Tooltip(
      message: tooltip,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 10, color: kMutedGray),
          const SizedBox(width: 3),
          Text(
            label,
            style: const TextStyle(fontSize: 11, color: kMutedGray),
          ),
        ],
      ),
    );
  }
}
