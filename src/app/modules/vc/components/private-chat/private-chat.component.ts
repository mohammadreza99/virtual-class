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
  enableChat: boolean;

  ngOnInit(): void {
    this.loadData();
  }

  async loadData() {
    this.updateViewService.getViewEvent().subscribe(res => {
      switch (res.event) {
        case 'newPVMessage':
          this.getPvList();
          break;

        case 'privateChatState':
          this.enableChat = res.data.value;
          break;
      }
    });
    this.getPvList();
  }

  async getPvList() {
    const result = await this.sessionService.getPVList().toPromise();
    if (result.status === 'OK') {
      this.privateChats = result.data;
    }
  }

  setState(state: 'chatList' | 'contacts' | 'chat') {
    this.state = state;
  }

  async onSelectContact(user: RoomUser) {
    const res = await this.sessionService.openPV(user.id).toPromise();
    if (res.status === 'OK') {
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
    const foundedChatItem = this.privateChats.find(item => item.id == pvId);
    if (res.status === 'OK') {
      res.data.items.forEach(m => {
        Object.assign(m, {
          user: foundedChatItem.user.id == m.user_id ? foundedChatItem.user : this.sessionService.currentUser,
          message: {
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

  async onBackToListClick() {
    await this.getPvList();
    this.setState('chatList');
  }
}
