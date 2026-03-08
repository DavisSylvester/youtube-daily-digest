import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/topics', pathMatch: 'full' },
  {
    path: 'topics',
    loadComponent: () =>
      import('./pages/topics/topics.component').then((m) => m.TopicsComponent),
  },
  {
    path: 'videos',
    loadComponent: () =>
      import('./pages/videos/videos.component').then((m) => m.VideosComponent),
  },
  { path: '**', redirectTo: '/topics' },
];
