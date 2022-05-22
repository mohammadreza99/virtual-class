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

  @Input() enablePublicChat: boolean = true;
  @Input() enablePrivateChat: boolean = true;
  @Output() closeSidebar = new EventEmitter();
  @Output() newMessage = new EventEmitter();


  async togglePublicChatActivation(chatActions: OverlayPanel) {
    await this.sessionService.changePublicChatState(!this.enablePublicChat).toPromise();
    chatActions.hide();
  }

  togglePrivateChatActivation(activate: boolean) {
  }

  saveChat() {
  }

  clearChat() {

  }
}
