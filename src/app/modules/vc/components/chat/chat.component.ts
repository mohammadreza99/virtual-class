import {Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, ViewContainerRef} from '@angular/core';
import {SessionService} from '@core/http';
import {RoomUser} from '@core/models';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {OverlayPanel} from 'primeng/overlaypanel';
import {UpdateViewService} from '@core/http/update-view.service';

@Component({
  selector: 'ng-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent extends LanguageChecker implements OnInit {

  constructor(private sessionService: SessionService, private updateViewService: UpdateViewService) {
    super();
  }

  @Input() openPublicChat: boolean = true;
  @Input() openPrivateChat: boolean = true;
  @Output() closeSidebar = new EventEmitter();
  @ViewChild('chatContainer', {static: true}) chatContainer: ElementRef;
  // @ViewChild('chatItemContainer', {static: true, read: ViewContainerRef}) chatItemContainer: ViewContainerRef;

  publicMessages: any[] = [];
  currentUser: RoomUser;
  chatText: string;
  currentReplyMessage: any;

  ngOnInit(): void {
    this.loadData();
    this.scrollDown();
  }

  async loadData() {
    this.currentUser = this.sessionService.currentUser;
    this.updateViewService.getViewEvent().subscribe(res => {
      switch (res.event) {
        case 'publicMessages':
          this.publicMessages = res.data;
          break;

        case 'newPublicMessage':
          this.publicMessages.push({message: res.data.message, user: res.data.user});
          break;

        case 'deletedMessage':
          break;

        case 'publicChatState':
          this.openPublicChat = res.data.value;
          break;
      }
    });
  }

  async sendMessage(callback?: () => any) {
    if (!this.chatText) {
      return;
    }
    const result = await this.sessionService.sendPublicMessage(this.chatText, this.currentReplyMessage?.message?.id).toPromise();
    if (callback) {
      callback();
    }
    // if (result.status == 'OK') {
    // this.publicMessages.push({message: result.data.message, user: this.sessionService.currentUser});
    // const factory = this.resolver.resolveComponentFactory(MessageItemComponent);
    // const cmpRef = this.chatContainer.createComponent(factory);
    // cmpRef.instance.position = 'right';
    // cmpRef.instance.message = result.data.message;
    // cmpRef.instance.sender = this.sessionService.currentUser;
    // if (this.currentReplyMessage?.id) {
    //   cmpRef.instance.replyMessage = this.currentReplyMessage;
    // }
    // }
    this.chatText = '';
    this.currentReplyMessage = null;
    this.scrollDown();
  }

  onReply(message: any) {
    this.currentReplyMessage = message;
  }

  cancelReply() {
    this.currentReplyMessage = null;
  }

  getReplyMessageOf(message: any) {
    if (message.message.reply_to_message_id) {
      return this.publicMessages.find(m => m.message.id == message.message.reply_to_message_id);
    }
  }

  saveChat() {
  }

  async togglePublicChatActivation(chatActions: OverlayPanel) {
    const result = await this.sessionService.changePublicChatState(!this.openPublicChat).toPromise();
    // if (result.status == 'OK') {
    //   this.openPublicChat = !this.openPublicChat;
    // }
    chatActions.hide();
  }

  togglePrivateChatActivation(activate: boolean) {
  }

  trackByFn(index: number, item: any): number {
    return item.id;
  }

  scrollDown() {
    this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    this.chatContainer.nativeElement.scroll({
      top: this.chatContainer.nativeElement.scrollHeight,
      left: 0,
      behavior: 'smooth'
    });
  }
}
