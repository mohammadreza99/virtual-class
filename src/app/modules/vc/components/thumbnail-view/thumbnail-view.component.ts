import {Component, Input, OnInit} from '@angular/core';
import {RoomUser} from '@core/models';

@Component({
  selector: 'ng-thumbnail-view',
  templateUrl: './thumbnail-view.component.html',
  styleUrls: ['./thumbnail-view.component.scss']
})
export class ThumbnailViewComponent implements OnInit {

  constructor() {
  }

  @Input() users: RoomUser[];

  ngOnInit(): void {
  }

  trackByFn(index: number, item: RoomUser): number {
    return item.id;
  }
}
