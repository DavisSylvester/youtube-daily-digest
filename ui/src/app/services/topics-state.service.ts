import { Injectable, inject, signal, computed } from '@angular/core';
import { ApiService } from './api.service';
import type { Topic, TopicQuery } from '../models';

@Injectable({ providedIn: 'root' })
export class TopicsStateService {
  private readonly api = inject(ApiService);

  // ── State ──────────────────────────────────────────────────────────────────
  readonly topics = signal<Topic[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // Accordion
  readonly expandedTopicIds = signal<ReadonlySet<number>>(new Set());

  // Running searches
  readonly searchingTopicIds = signal<ReadonlySet<number>>(new Set());

  // New-topic form
  readonly showNewTopicForm = signal(false);
  readonly newTopicName = signal('');
  readonly savingTopic = signal(false);

  // Query add form
  readonly addingToTopicId = signal<number | null>(null);
  readonly newQueryText = signal('');
  readonly newQueryPriority = signal(1);

  // Query edit form
  readonly editingQueryId = signal<number | null>(null);
  readonly editQueryText = signal('');
  readonly editQueryPriority = signal(1);

  // ── Derived ────────────────────────────────────────────────────────────────
  readonly hasTopics = computed(() => this.topics().length > 0);

  isExpanded(topicId: number): boolean {
    return this.expandedTopicIds().has(topicId);
  }

  isSearching(topicId: number): boolean {
    return this.searchingTopicIds().has(topicId);
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  loadTopics(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getTopics().subscribe({
      next: (topics) => {
        this.topics.set(topics);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load topics. Is the API server running? (bun run dev:api)');
        this.loading.set(false);
      },
    });
  }

  toggleExpand(topicId: number): void {
    this.expandedTopicIds.update((prev) => {
      const next = new Set(prev);
      next.has(topicId) ? next.delete(topicId) : next.add(topicId);
      return next;
    });
  }

  openNewTopicForm(): void {
    this.showNewTopicForm.set(true);
    this.newTopicName.set('');
  }

  cancelNewTopic(): void {
    this.showNewTopicForm.set(false);
  }

  saveTopic(): void {
    const name = this.newTopicName().trim();
    if (!name) return;
    this.savingTopic.set(true);
    this.api.createTopic(name).subscribe({
      next: (topic) => {
        this.showNewTopicForm.set(false);
        this.savingTopic.set(false);
        this.loadTopics();
        this.runSearch(topic.id);
      },
      error: () => {
        this.savingTopic.set(false);
        alert('Failed to create topic.');
      },
    });
  }

  runSearch(topicId: number): void {
    this.searchingTopicIds.update((prev) => new Set([...prev, topicId]));
    this.api.searchTopic(topicId).subscribe({
      next: () => this._removeSearching(topicId),
      error: () => {
        this._removeSearching(topicId);
        alert('Failed to start search.');
      },
    });
  }

  private _removeSearching(topicId: number): void {
    this.searchingTopicIds.update((prev) => {
      const next = new Set(prev);
      next.delete(topicId);
      return next;
    });
  }

  startAdd(topicId: number): void {
    this.addingToTopicId.set(topicId);
    this.newQueryText.set('');
    this.newQueryPriority.set(1);
    this.editingQueryId.set(null);
    this.expandedTopicIds.update((prev) => new Set([...prev, topicId]));
  }

  cancelAdd(): void {
    this.addingToTopicId.set(null);
  }

  addQuery(topicId: number): void {
    const text = this.newQueryText().trim();
    if (!text) return;
    this.api.addQuery(topicId, text, this.newQueryPriority()).subscribe({
      next: () => {
        this.addingToTopicId.set(null);
        this.loadTopics();
      },
      error: () => alert('Failed to add query.'),
    });
  }

  startEdit(query: TopicQuery): void {
    this.editingQueryId.set(query.id);
    this.editQueryText.set(query.queryText);
    this.editQueryPriority.set(query.priority);
    this.addingToTopicId.set(null);
  }

  cancelEdit(): void {
    this.editingQueryId.set(null);
  }

  saveEdit(): void {
    const id = this.editingQueryId();
    const text = this.editQueryText().trim();
    if (!id || !text) return;
    this.api.updateQuery(id, text, this.editQueryPriority()).subscribe({
      next: () => {
        this.editingQueryId.set(null);
        this.loadTopics();
      },
      error: () => alert('Failed to update query.'),
    });
  }

  toggleQuery(query: TopicQuery): void {
    this.api.toggleQuery(query.id, query.isActive ? 0 : 1).subscribe({
      next: () => this.loadTopics(),
      error: () => alert('Failed to toggle query.'),
    });
  }

  deleteQuery(queryId: number): void {
    if (!confirm('Delete this query?')) return;
    this.api.deleteQuery(queryId).subscribe({
      next: () => this.loadTopics(),
      error: () => alert('Failed to delete query.'),
    });
  }
}
