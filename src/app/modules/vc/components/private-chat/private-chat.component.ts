import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {SessionService} from '@core/http';
import {UpdateViewService} from '@core/utils';
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
  state: 'contacts' | 'chatList' | 'chat' = 'chatList';
  contacts: RoomUser[] = [];
  peerUser: RoomUser;
  currentPVId: number;
  privateChats: any[] = [];

  ngOnInit(): void {
    this.loadData();
  }

  async loadData() {
    this.updateViewService.getViewEvent().pipe(takeUntil(this.destroy$)).subscribe(res => {
      switch (res.event) {
        case 'privateMessagesChange':
          this.messages = res.data;
          break;

        case 'newPVMessage':
          this.setState('chat');
          this.peerUser = res.data.user;
          this.currentPVId = res.data.pv_id;
          this.messages.push({message: res.data.message, user: res.data.user});
          if (this.sessionService.currentUser.id != res.data.user.id) {
            this.newMessage.emit();
          }
          break;

        case 'messageMutedUser':
          if (this.sessionService.currentUser.id == res.data.user_id) {
            this.openChat = false;
          }
          break;
      }
    });
    const res = await this.sessionService.getPVList().toPromise();
    if (res.status == 'OK') {
      this.privateChats = res.data;
    }
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

  async onSelectContact(user: RoomUser) {
    const res = await this.sessionService.openPV(user.id).toPromise();
    if (res.status == 'OK') {
      this.currentPVId = res.data.pv_id;
      this.peerUser = user;
      await this.openPrivateChat(this.currentPVId);
      this.setState('chat');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  async onPrivateChatClick(pvItem: any) {
    this.peerUser = pvItem.user;
    this.currentPVId = pvItem.id;
    await this.openPrivateChat(this.currentPVId);
    this.setState('chat');
  }

  async openPrivateChat(pvId: number) {
    const res = await this.sessionService.getPVMessage(pvId).toPromise();
    if (res.status == 'OK') {
      res.data.items.forEach(m => {
        const founded = this.privateChats.find(item => item.id == m.private_chat_id);
        Object.assign(m, {
          user: founded.user, message: {
            datetime: m.datetime,
            id: m.id,
            message: m.message,
            private_chat_id: m.private_chat_id,
            reply_to_message_id: m.reply_to_message_id,
          }
        });
      });
      this.messages = res.data.items;
    }
  }
}
