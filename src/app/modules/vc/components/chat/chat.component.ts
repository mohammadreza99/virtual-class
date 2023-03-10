import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {SessionService} from '@core/http';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {OverlayPanel} from 'primeng/overlaypanel';
import {UpdateViewService} from '@core/utils';

@Component({
  selector: 'ng-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent extends LanguageChecker implements OnInit {

  constructor(private sessionService: SessionService, private updateViewService: UpdateViewService) {
    super();
  }

  @Output() closeSidebar = new EventEmitter();

  enablePublicChat: boolean = true;
  enablePrivateChat: boolean = true;
  activeTab = 0; // publicChat
  unreadPrivateMessage: any;
  unreadPublicMessage: any;

  ngOnInit() {
    this.updateViewService.getViewEvent().subscribe(res => {
      switch (res.event) {
        case 'gotNewPublicMessage':
          if (this.activeTab != 0) {
            this.unreadPublicMessage = true;
          }
          break;

        case 'gotNewPrivateMessage':
          if (this.activeTab != 1) {
            this.unreadPrivateMessage = true;
          }
          break;

        case 'publicChatState':
          this.enablePublicChat = res.data.value;
          break;
      }
    });
  }

  async togglePublicChatActivation(chatActions: OverlayPanel) {
    const res = await this.sessionService.changePublicChatState(!this.enablePublicChat).toPromise();
    chatActions.hide();
    if (res.status == 'OK') {
      this.enablePublicChat = !this.enablePublicChat;
    }
  }

  async togglePrivateChatActivation(chatActions: OverlayPanel) {
    const res = await this.sessionService.changePublicChatState(!this.enablePrivateChat).toPromise();
    chatActions.hide();
    if (res.status == 'OK') {
      this.enablePrivateChat = !this.enablePrivateChat;
    }
  }

  onSaveChatClick() {
  }

  onClearChatClick(chatActions: OverlayPanel) {
    chatActions.hide();
    this.sessionService.clearPublicMessages().toPromise();
  }

  onChangeTab(event: number) {
    this.activeTab = event;
    if (this.activeTab == 0) {
      this.unreadPublicMessage = false;
    }
    if (this.activeTab == 1) {
      this.unreadPrivateMessage = false;
    }
  }
}
