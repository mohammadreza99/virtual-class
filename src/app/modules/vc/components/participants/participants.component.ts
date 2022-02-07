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

  @Input() allUsers: RoomUser[];
  @Input() raisedHandsUsers: RoomUser[];
  @Output() closeSidebar = new EventEmitter();

  ngOnInit(): void {
  }

  async toggleMuteAll(event) {
    try {
      await this.sessionService.muteAll(!event.checked).toPromise();
      this.allMuted = !event.checked;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async toggleMuteVideoAll(event) {
    try {
      await this.sessionService.muteVideoAll(!event.checked).toPromise();
      this.allMutedVideo = !event.checked;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
