import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { VideosStateService } from '../../services/videos-state.service';

@Component({
  selector: 'app-videos',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './videos.component.html',
})
export class VideosComponent implements OnInit {
  readonly state = inject(VideosStateService);

  ngOnInit(): void {
    this.state.loadVideos();
  }
}
