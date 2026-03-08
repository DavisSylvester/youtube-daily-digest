class TopicLastRun {
  final String status;
  final String startedAt;
  final String? finishedAt;
  final int discoveredCount;

  const TopicLastRun({
    required this.status,
    required this.startedAt,
    this.finishedAt,
    required this.discoveredCount,
  });

  factory TopicLastRun.fromJson(Map<String, dynamic> json) {
    return TopicLastRun(
      status: json['status'] as String? ?? 'unknown',
      startedAt: json['startedAt'] as String? ?? '',
      finishedAt: json['finishedAt'] as String?,
      discoveredCount: (json['discoveredCount'] as num?)?.toInt() ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
        'status': status,
        'startedAt': startedAt,
        'finishedAt': finishedAt,
        'discoveredCount': discoveredCount,
      };
}

class TopicQuery {
  final int id;
  final int topicId;
  final String queryText;
  final int priority;
  final int isActive;

  const TopicQuery({
    required this.id,
    required this.topicId,
    required this.queryText,
    required this.priority,
    required this.isActive,
  });

  factory TopicQuery.fromJson(Map<String, dynamic> json) {
    return TopicQuery(
      id: (json['id'] as num).toInt(),
      topicId: (json['topicId'] as num).toInt(),
      queryText: json['queryText'] as String? ?? '',
      priority: (json['priority'] as num?)?.toInt() ?? 1,
      isActive: (json['isActive'] as num?)?.toInt() ?? 1,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'topicId': topicId,
        'queryText': queryText,
        'priority': priority,
        'isActive': isActive,
      };

  TopicQuery copyWith({
    int? id,
    int? topicId,
    String? queryText,
    int? priority,
    int? isActive,
  }) {
    return TopicQuery(
      id: id ?? this.id,
      topicId: topicId ?? this.topicId,
      queryText: queryText ?? this.queryText,
      priority: priority ?? this.priority,
      isActive: isActive ?? this.isActive,
    );
  }
}

class Topic {
  final int id;
  final String name;
  final String slug;
  final int isActive;
  final String createdAt;
  final int videoCount;
  final TopicLastRun? lastRun;
  final List<TopicQuery> queries;

  const Topic({
    required this.id,
    required this.name,
    required this.slug,
    required this.isActive,
    required this.createdAt,
    required this.videoCount,
    this.lastRun,
    required this.queries,
  });

  factory Topic.fromJson(Map<String, dynamic> json) {
    final lastRunData = json['lastRun'];
    final queriesData = json['queries'];

    return Topic(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String? ?? '',
      slug: json['slug'] as String? ?? '',
      isActive: (json['isActive'] as num?)?.toInt() ?? 1,
      createdAt: json['createdAt'] as String? ?? '',
      videoCount: (json['videoCount'] as num?)?.toInt() ?? 0,
      lastRun: lastRunData != null
          ? TopicLastRun.fromJson(lastRunData as Map<String, dynamic>)
          : null,
      queries: queriesData != null
          ? (queriesData as List<dynamic>)
              .map((q) => TopicQuery.fromJson(q as Map<String, dynamic>))
              .toList()
          : [],
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'slug': slug,
        'isActive': isActive,
        'createdAt': createdAt,
        'videoCount': videoCount,
        'lastRun': lastRun?.toJson(),
        'queries': queries.map((q) => q.toJson()).toList(),
      };

  Topic copyWith({
    int? id,
    String? name,
    String? slug,
    int? isActive,
    String? createdAt,
    int? videoCount,
    TopicLastRun? lastRun,
    List<TopicQuery>? queries,
  }) {
    return Topic(
      id: id ?? this.id,
      name: name ?? this.name,
      slug: slug ?? this.slug,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      videoCount: videoCount ?? this.videoCount,
      lastRun: lastRun ?? this.lastRun,
      queries: queries ?? this.queries,
    );
  }
}
