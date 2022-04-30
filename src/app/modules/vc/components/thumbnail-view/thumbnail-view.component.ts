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

  toggleSpeaker: boolean = false;
  toggleParticipants: boolean = false;

  ngOnInit(): void {
  }

  toggleSpeakerClick() {
    this.toggleSpeaker = !this.toggleSpeaker;
  }

  trackByFn(index: number, item: RoomUser): number {
    return item.id;
  }

  toggleParticipantsClick() {
    this.toggleParticipants = !this.toggleParticipants;
  }
}
