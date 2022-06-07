import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {SessionService} from '@core/http';
import {UpdateViewService} from '@core/utils';
import {RoomUser} from '@core/models';

@Component({
  selector: 'ng-private-chat',
  templateUrl: './private-chat.component.html',
  styleUrls: ['./private-chat.component.scss'],
})
export class PrivateChatComponent extends LanguageChecker implements OnInit {
  constructor(private sessionService: SessionService,
              private updateViewService: UpdateViewService) {
    super();
  }

  state: 'contacts' | 'chatList' | 'chat' = 'chatList';
  contacts: RoomUser[] = [];
  peerUser: RoomUser;
  privateChats: any[] = [];

  ngOnInit(): void {
    this.loadData();
  }

  async loadData() {
    const res = await this.sessionService.getPVList().toPromise();
    if (res.status == 'OK') {
      this.privateChats = res.data;
    }
  }

  setState(state: 'chatList' | 'contacts' | 'chat') {
    this.state = state;
  }

  async onSelectContact(user: RoomUser) {
    const res = await this.sessionService.openPV(user.id).toPromise();
    if (res.status == 'OK') {
      this.peerUser = user;
      this.setState('chat');
      await this.openPrivateChat(res.data.pv_id);
    }
  }

  async onPrivateChatClick(pvItem: any) {
    this.peerUser = pvItem.user;
    this.setState('chat');
    await this.openPrivateChat(pvItem.id);
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
      this.updateViewService.setViewEvent({event: 'privateMessagesChange', data: {messages: res.data.items, pvId}});
    }
  }
}
