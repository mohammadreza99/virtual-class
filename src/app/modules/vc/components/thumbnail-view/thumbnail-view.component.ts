import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {RoomUser} from '@core/models';
import {KonvaService} from '@core/utils';

@Component({
  selector: 'ng-thumbnail-view',
  templateUrl: './thumbnail-view.component.html',
  styleUrls: ['./thumbnail-view.component.scss']
})
export class ThumbnailViewComponent implements OnInit {

  constructor(private konvaService: KonvaService) {
  }

  @Input() users: RoomUser[];
  toggleParticipants: boolean = true;

  toggleSpeaker: boolean = false;

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
    setTimeout(() => {
      this.konvaService.fitStageIntoParentContainer();
    }, 500);
  }
}
