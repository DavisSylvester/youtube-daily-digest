import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import type { Topic, TopicQuery } from '../../models';

@Component({
  selector: 'app-topics',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './topics.component.html',
})
export class TopicsComponent implements OnInit {
  private readonly api = inject(ApiService);

  topics: Topic[] = [];
  loading = false;
  error: string | null = null;

  // Add topic
  showNewTopicForm = false;
  newTopicName = '';
  savingTopic = false;

  // Add query
  addingToTopicId: number | null = null;
  newQueryText = '';
  newQueryPriority = 1;

  // Edit query
  editingQueryId: number | null = null;
  editQueryText = '';
  editQueryPriority = 1;

  // Search status
  searchingTopicIds = new Set<number>();

  // Accordion expand state
  expandedTopicIds = new Set<number>();

  toggleExpand(topicId: number): void {
    if (this.expandedTopicIds.has(topicId)) {
      this.expandedTopicIds.delete(topicId);
    } else {
      this.expandedTopicIds.add(topicId);
      // Close add/edit forms when collapsing
    }
  }

  ngOnInit(): void {
    this.loadTopics();
  }

  loadTopics(): void {
    this.loading = true;
    this.error = null;
    this.api.getTopics().subscribe({
      next: (topics) => {
        this.topics = topics;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load topics. Is the API server running? (bun run dev:api)';
        this.loading = false;
      },
    });
  }

  openNewTopicForm(): void {
    this.showNewTopicForm = true;
    this.newTopicName = '';
  }

  cancelNewTopic(): void {
    this.showNewTopicForm = false;
  }

  saveTopic(): void {
    if (!this.newTopicName.trim()) return;
    this.savingTopic = true;
    this.api.createTopic(this.newTopicName.trim()).subscribe({
      next: (topic) => {
        this.showNewTopicForm = false;
        this.savingTopic = false;
        this.loadTopics();
        this.runSearch(topic.id);
      },
      error: () => {
        this.savingTopic = false;
        alert('Failed to create topic.');
      },
    });
  }

  runSearch(topicId: number): void {
    this.searchingTopicIds.add(topicId);
    this.api.searchTopic(topicId).subscribe({
      next: () => this.searchingTopicIds.delete(topicId),
      error: () => {
        this.searchingTopicIds.delete(topicId);
        alert('Failed to start search.');
      },
    });
  }

  startAdd(topicId: number): void {
    this.addingToTopicId = topicId;
    this.newQueryText = '';
    this.newQueryPriority = 1;
    this.editingQueryId = null;
    this.expandedTopicIds.add(topicId);
  }

  cancelAdd(): void {
    this.addingToTopicId = null;
  }

  addQuery(topicId: number): void {
    if (!this.newQueryText.trim()) return;
    this.api.addQuery(topicId, this.newQueryText.trim(), this.newQueryPriority).subscribe({
      next: () => {
        this.addingToTopicId = null;
        this.loadTopics();
      },
      error: () => alert('Failed to add query.'),
    });
  }

  startEdit(query: TopicQuery): void {
    this.editingQueryId = query.id;
    this.editQueryText = query.queryText;
    this.editQueryPriority = query.priority;
    this.addingToTopicId = null;
  }

  cancelEdit(): void {
    this.editingQueryId = null;
  }

  saveEdit(): void {
    if (!this.editingQueryId || !this.editQueryText.trim()) return;
    this.api
      .updateQuery(this.editingQueryId, this.editQueryText.trim(), this.editQueryPriority)
      .subscribe({
        next: () => {
          this.editingQueryId = null;
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
