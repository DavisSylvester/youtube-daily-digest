import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TopicsStateService } from '../../services/topics-state.service';

@Component({
  selector: 'app-topics',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './topics.component.html',
})
export class TopicsComponent implements OnInit {
  readonly state = inject(TopicsStateService);

  ngOnInit(): void {
    this.state.loadTopics();
  }
}
