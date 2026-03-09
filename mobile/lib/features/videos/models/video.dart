class Video {
  final String videoId;
  final String title;
  final String? channelId;
  final String? channelTitle;
  final String publishedAt;
  final String url;
  final String? description;
  final String? thumbnailUrl;
  final String firstSeenAt;
  final int isShort;

  const Video({
    required this.videoId,
    required this.title,
    this.channelId,
    this.channelTitle,
    required this.publishedAt,
    required this.url,
    this.description,
    this.thumbnailUrl,
    required this.firstSeenAt,
    required this.isShort,
  });

  factory Video.fromJson(Map<String, dynamic> json) {
    return Video(
      videoId: json['videoId'] as String? ?? '',
      title: json['title'] as String? ?? '',
      channelId: json['channelId'] as String?,
      channelTitle: json['channelTitle'] as String?,
      publishedAt: json['publishedAt'] as String? ?? '',
      url: json['url'] as String? ?? '',
      description: json['description'] as String?,
      thumbnailUrl: json['thumbnailUrl'] as String?,
      firstSeenAt: json['firstSeenAt'] as String? ?? '',
      isShort: (json['isShort'] as num?)?.toInt() ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
        'videoId': videoId,
        'title': title,
        'channelId': channelId,
        'channelTitle': channelTitle,
        'publishedAt': publishedAt,
        'url': url,
        'description': description,
        'thumbnailUrl': thumbnailUrl,
        'firstSeenAt': firstSeenAt,
        'isShort': isShort,
      };

  bool get isShortVideo => isShort == 1;

  String get youtubeUrl {
    if (isShortVideo) {
      return 'https://www.youtube.com/shorts/$videoId';
    }
    return 'https://www.youtube.com/watch?v=$videoId';
  }
}

class VideosResponse {
  final List<Video> videos;
  final int total;
  final int page;
  final int pageSize;

  const VideosResponse({
    required this.videos,
    required this.total,
    required this.page,
    required this.pageSize,
  });

  factory VideosResponse.fromJson(Map<String, dynamic> json) {
    final videosData = json['videos'] as List<dynamic>? ?? [];
    return VideosResponse(
      videos: videosData
          .map((v) => Video.fromJson(v as Map<String, dynamic>))
          .toList(),
      total: (json['total'] as num?)?.toInt() ?? 0,
      page: (json['page'] as num?)?.toInt() ?? 1,
      pageSize: (json['pageSize'] as num?)?.toInt() ?? 50,
    );
  }

  int get totalPages => pageSize > 0 ? (total / pageSize).ceil() : 0;
  bool get hasNextPage => page < totalPages;
  bool get hasPrevPage => page > 1;
}
