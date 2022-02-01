import {Component, EventEmitter, Input, OnInit, Output, ViewChild, ViewContainerRef} from '@angular/core';
import {SessionService} from '@core/http';
import {RoomUser} from '@core/models';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {OverlayPanel} from 'primeng/overlaypanel';

@Component({
  selector: 'ng-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent extends LanguageChecker implements OnInit {

  constructor(private sessionService: SessionService,) {
    super();
  }

  @Input() openPublicChat: boolean = true;
  @Input() openPrivateChat: boolean = true;
  @Output() closeSidebar = new EventEmitter();
  @ViewChild('chatItemContainer', {static: true, read: ViewContainerRef}) chatContainer: ViewContainerRef;

  currentUser: RoomUser;
  chatText: string;
  messages: any[];
  currentReplyMessage: any;

  ngOnInit(): void {
    this.loadData();
  }

  async loadData() {
    this.currentUser = this.sessionService.currentUser;
    const result = await this.sessionService.getPublicMessages().toPromise();
    if (result.status == 'OK') {
      this.messages = result.data.items.reverse();
    }
  }

  async sendMessage(container: HTMLElement, callback?: () => any) {
    if (!this.chatText) {
      return;
    }
    const result = await this.sessionService.sendPublicMessage(this.chatText, this.currentReplyMessage?.message?.id).toPromise();
    if (callback) {
      callback();
    }
    if (result.status == 'OK') {
      this.messages.push({message: result.data.message, user: this.sessionService.currentUser});
      // const factory = this.resolver.resolveComponentFactory(MessageItemComponent);
      // const cmpRef = this.chatContainer.createComponent(factory);
      // cmpRef.instance.position = 'right';
      // cmpRef.instance.message = result.data.message;
      // cmpRef.instance.sender = this.sessionService.currentUser;
      // if (this.currentReplyMessage?.id) {
      //   cmpRef.instance.replyMessage = this.currentReplyMessage;
      // }
    }
    this.chatText = '';
    this.currentReplyMessage = null;
    setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, 0);
  }

  onReply(message: any) {
    this.currentReplyMessage = message;
  }

  cancelReply() {
    this.currentReplyMessage = null;
  }

  getReplyMessageOf(message: any) {
    if (message.message.reply_to_message_id) {
      return this.messages.find(m => m.message.id == message.message.reply_to_message_id);
    }
  }

  saveChat() {
  }

  async togglePublicChatActivation(chatActions: OverlayPanel) {
    const result = await this.sessionService.changePublicChatState(!this.openPublicChat).toPromise();
    if (result.status == 'OK') {
      this.openPublicChat = !this.openPublicChat;
    }
    chatActions.hide();
  }

  togglePrivateChatActivation(activate: boolean) {
  }

  trackByFn(index: number, item: any): number {
    return item.id;
  }
}
