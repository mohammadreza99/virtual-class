import {Component, Input, OnInit, TemplateRef} from '@angular/core';
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
  hideScreen: boolean = false;
  @Input() whiteboardTemplate: TemplateRef<any>;

  ngOnInit(): void {
  }

  toggleScreen() {
    this.hideScreen = !this.hideScreen;
  }

  trackByFn(index: number, item: RoomUser): number {
    return item.id;
  }
}
