import {Component, EventEmitter, Input, Output} from '@angular/core';
import {SessionService} from '@core/http';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {OverlayPanel} from 'primeng/overlaypanel';

@Component({
  selector: 'ng-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent extends LanguageChecker {

  constructor(private sessionService: SessionService) {
    super();
  }

  @Input() openPublicChat: boolean = true;
  @Input() openPrivateChat: boolean = true;
  @Output() closeSidebar = new EventEmitter();
  @Output() newMessage = new EventEmitter();

  saveChat() {
  }

  async togglePublicChatActivation(chatActions: OverlayPanel) {
    await this.sessionService.changePublicChatState(!this.openPublicChat).toPromise();
    chatActions.hide();
  }

  togglePrivateChatActivation(activate: boolean) {
  }
}
