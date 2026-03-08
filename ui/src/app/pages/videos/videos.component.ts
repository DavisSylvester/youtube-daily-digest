import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import type { Video } from '../../models';

@Component({
  selector: 'app-videos',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './videos.component.html',
})
export class VideosComponent implements OnInit {
  private readonly api = inject(ApiService);

  videos: Video[] = [];
  filteredVideos: Video[] = [];
  total = 0;
  page = 1;
  readonly pageSize = 50;
  loading = false;
  error: string | null = null;
  searchTerm = '';
  selectedDate = this.todayString();

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  ngOnInit(): void {
    this.loadVideos();
  }

  loadVideos(): void {
    this.loading = true;
    this.error = null;
    this.api.getVideos(this.page, this.pageSize, this.selectedDate).subscribe({
      next: (res) => {
        this.videos = res.videos;
        this.total = res.total;
        this.loading = false;
        this.applyFilter();
      },
      error: () => {
        this.error = 'Failed to load videos. Is the API server running? (bun run dev:api)';
        this.loading = false;
      },
    });
  }

  onDateChange(): void {
    this.page = 1;
    this.loadVideos();
  }

  clearDate(): void {
    this.selectedDate = '';
    this.page = 1;
    this.loadVideos();
  }

  goToToday(): void {
    this.selectedDate = this.todayString();
    this.page = 1;
    this.loadVideos();
  }

  applyFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredVideos = this.videos;
    } else {
      this.filteredVideos = this.videos.filter(
        (v) =>
          v.title.toLowerCase().includes(term) ||
          (v.channelTitle ?? '').toLowerCase().includes(term),
      );
    }
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.loadVideos();
    }
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadVideos();
    }
  }

  todayString(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
