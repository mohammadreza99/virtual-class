import {Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {SessionService} from '@core/http';
import {UpdateViewService} from '@core/utils';
import {UtilsService} from '@ng/services';
import {Subject} from 'rxjs';
import {RoomUser} from '@core/models';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'ng-private-chat',
  templateUrl: './private-chat.component.html',
  styleUrls: ['./private-chat.component.scss'],
})
export class PrivateChatComponent extends LanguageChecker implements OnInit, OnDestroy {
  constructor(private sessionService: SessionService,
              private updateViewService: UpdateViewService) {
    super();
  }

  @Input() openChat: boolean;
  @Output() newMessage = new EventEmitter();

  destroy$: Subject<boolean> = new Subject<boolean>();
  messages: any[] = [];
  chatList: any[] = [];
  state: 'contacts' | 'chatList' | 'chat' = 'chatList';
  contacts: RoomUser[] = [];
  peerUser: RoomUser;
  currentPVId: number;

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.updateViewService.getViewEvent().pipe(takeUntil(this.destroy$)).subscribe(res => {
      switch (res.event) {
        case 'privateMessagesChange':
          this.messages = res.data;
          break;

        case 'newPVMessage':
          this.messages.push({message: res.data.message, user: res.data.user});
          if (this.sessionService.currentUser.id != res.data.user.id) {
            this.newMessage.emit();
          }
          break;
      }
    });
  }

  async sendMessage(event: any) {
    const {message, replyMessage, callback} = event;
    const result = await this.sessionService.sendPVMessage(this.currentPVId, message, replyMessage?.message?.id).toPromise();
    if (result.status == 'OK') {
      if (callback) {
        callback();
      }
    }
  }

  async onDelete(message: any) {
    try {
      await this.sessionService.deletePublicMessage(message.message.id).toPromise();
    } catch (error) {

    }
  }

  setState(state: 'chatList' | 'contacts' | 'chat') {
    this.state = state;
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  async onSelectContact(user: RoomUser) {
    this.peerUser = user;
    const res = await this.sessionService.openPV(this.peerUser.id).toPromise();
    if (res.status == 'OK') {
      this.currentPVId = res.data.pv_id;
      this.setState('chat');
    }
  }
}
