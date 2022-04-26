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
  muteAllLoading: boolean = false;
  muteVideoAllLoading: boolean = false;

  @Input() allUsers: RoomUser[];
  @Input() raisedHandsUsers: RoomUser[];
  @Input() kickedUsers: RoomUser[];
  @Output() closeSidebar = new EventEmitter();

  ngOnInit(): void {
  }

  async toggleMuteAll(event) {
    try {
      this.muteAllLoading = true;
      await this.sessionService.muteAll(!event.checked).toPromise();
      this.allMuted = !event.checked;
      this.muteAllLoading = false;
    } catch (error) {
      console.error(error);
      this.muteAllLoading = false;
      this.allMuted = false;
      throw error;
    }
  }

  async toggleMuteVideoAll(event) {
    try {
      this.muteVideoAllLoading = true;
      await this.sessionService.muteVideoAll(!event.checked).toPromise();
      this.allMutedVideo = !event.checked;
      this.muteVideoAllLoading = false;
    } catch (error) {
      console.error(error);
      this.muteVideoAllLoading = false;
      this.allMutedVideo = false;
      throw error;
    }
  }

  trackByFn(item: RoomUser, index: number) {
    return item.id;
  }
}
