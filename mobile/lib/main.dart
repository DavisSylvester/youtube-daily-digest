import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:youtube_daily_digest/router.dart';
import 'package:youtube_daily_digest/shared/theme.dart';

void main() {
  runApp(
    const ProviderScope(
      child: YouTubeDailyDigestApp(),
    ),
  );
}

class YouTubeDailyDigestApp extends StatelessWidget {
  const YouTubeDailyDigestApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'YouTube Daily Digest',
      theme: buildAppTheme(),
      routerConfig: goRouter,
      debugShowCheckedModeBanner: false,
    );
  }
}
