import { Injectable, inject, signal, computed } from '@angular/core';
import { ApiService } from './api.service';
import type { Video } from '../models';

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

@Injectable({ providedIn: 'root' })
export class VideosStateService {
  private readonly api = inject(ApiService);

  // ── State ──────────────────────────────────────────────────────────────────
  readonly videos = signal<Video[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(50);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly selectedDate = signal(todayString());

  // ── Derived ────────────────────────────────────────────────────────────────
  readonly filteredVideos = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const all = this.videos();
    if (!term) return all;
    return all.filter(
      (v) =>
        v.title.toLowerCase().includes(term) ||
        (v.channelTitle ?? '').toLowerCase().includes(term),
    );
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.pageSize())),
  );

  readonly hasPagination = computed(() => this.total() > this.pageSize());

  todayString(): string {
    return todayString();
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  loadVideos(): void {
    this.loading.set(true);
    this.error.set(null);
    const date = this.selectedDate();
    this.api.getVideos(this.page(), this.pageSize(), date || undefined).subscribe({
      next: (res) => {
        this.videos.set(res.videos);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load videos. Is the API server running? (bun run dev:api)');
        this.loading.set(false);
      },
    });
  }

  setSearchTerm(term: string): void {
    this.searchTerm.set(term);
  }

  onDateChange(date: string): void {
    this.selectedDate.set(date);
    this.page.set(1);
    this.loadVideos();
  }

  clearDate(): void {
    this.selectedDate.set('');
    this.page.set(1);
    this.loadVideos();
  }

  goToToday(): void {
    this.selectedDate.set(todayString());
    this.page.set(1);
    this.loadVideos();
  }

  prevPage(): void {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
      this.loadVideos();
    }
  }

  nextPage(): void {
    if (this.page() < this.totalPages()) {
      this.page.update((p) => p + 1);
      this.loadVideos();
    }
  }
}
