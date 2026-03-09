import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:youtube_daily_digest/features/topics/screens/topics_screen.dart';
import 'package:youtube_daily_digest/features/videos/screens/videos_screen.dart';

final goRouter = GoRouter(
  initialLocation: '/topics',
  routes: [
    StatefulShellRoute.indexedStack(
      builder: (context, state, shell) {
        return _ScaffoldWithNav(shell: shell);
      },
      branches: [
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/topics',
              builder: (context, state) => const TopicsScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/videos',
              builder: (context, state) => const VideosScreen(),
            ),
          ],
        ),
      ],
    ),
  ],
);

class _ScaffoldWithNav extends StatelessWidget {
  final StatefulNavigationShell shell;

  const _ScaffoldWithNav({required this.shell});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: shell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: shell.currentIndex,
        onDestinationSelected: (index) {
          shell.goBranch(
            index,
            initialLocation: index == shell.currentIndex,
          );
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.search_outlined),
            selectedIcon: Icon(Icons.search),
            label: 'Topics',
          ),
          NavigationDestination(
            icon: Icon(Icons.video_library_outlined),
            selectedIcon: Icon(Icons.video_library),
            label: 'Videos',
          ),
        ],
      ),
    );
  }
}
