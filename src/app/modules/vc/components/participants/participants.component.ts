import {Component, Input, OnInit, Output, EventEmitter} from '@angular/core';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {SessionService} from '@core/http';
import {RoomUser} from '@core/models';

@Component({
  selector: 'ng-participants',
  templateUrl: './participants.component.html',
  styleUrls: ['./participants.component.scss']
})
export class ParticipantsComponent extends LanguageChecker implements OnInit {

  constructor(private sessionService: SessionService) {
    super();
  }

  allMuted: boolean = false;
  allMutedVideo: boolean = false;
  searchText: string;
  loading: boolean = false;

  @Input() allUsers: RoomUser[];
  @Input() raisedHandsUsers: RoomUser[];
  @Input() kickedUsers: RoomUser[];
  @Output() closeSidebar = new EventEmitter();

  ngOnInit(): void {
  }

  async toggleMuteAll(event) {
    try {
      this.loading = true;
      await this.sessionService.muteAll(!event.checked).toPromise();
      this.allMuted = !event.checked;
      this.loading = false;
    } catch (error) {
      console.error(error);
      this.loading = false;
      this.allMuted = false;
      throw error;
    }
  }

  async toggleMuteVideoAll(event) {
    try {
      this.loading = true;
      await this.sessionService.muteVideoAll(!event.checked).toPromise();
      this.allMutedVideo = !event.checked;
      this.loading = false;
    } catch (error) {
      console.error(error);
      this.loading = false;
      this.allMutedVideo = false;
      throw error;
    }
  }

  trackByFn(item: RoomUser, index: number) {
    return item.id;
  }
}
