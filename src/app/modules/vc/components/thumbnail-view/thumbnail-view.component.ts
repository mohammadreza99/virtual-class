import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {RoomUser} from '@core/models';
import {KonvaService} from '@core/utils';

@Component({
  selector: 'ng-thumbnail-view',
  templateUrl: './thumbnail-view.component.html',
  styleUrls: ['./thumbnail-view.component.scss']
})
export class ThumbnailViewComponent implements OnInit, OnChanges {

  constructor(private konvaService: KonvaService) {
  }

  @Input() users: RoomUser[];
  @Input() toggleParticipants: boolean = false;

  toggleSpeaker: boolean = false;

  ngOnInit(): void {
  }

  ngOnChanges(changes) {
    if (!!(changes?.toggleParticipants?.previousValue)) {
      this.toggleParticipantsClick();
    }
  }

  toggleSpeakerClick() {
    this.toggleSpeaker = !this.toggleSpeaker;
  }

  trackByFn(index: number, item: RoomUser): number {
    return item.id;
  }

  toggleParticipantsClick() {
    this.toggleParticipants = !this.toggleParticipants;
    setTimeout(() => {
      this.konvaService.fitStageIntoParentContainer(null);
    }, 500);
  }
}
