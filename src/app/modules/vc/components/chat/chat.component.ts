import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output, QueryList,
  ViewChild,
  ViewChildren,
  ViewContainerRef
} from '@angular/core';
import {SessionService} from '@core/http';
import {RoomUser} from '@core/models';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {OverlayPanel} from 'primeng/overlaypanel';
import {UpdateViewService} from '@core/http/update-view.service';
import {UtilsService} from '@ng/services';
import {InputTextComponent} from '@ng/components/input-text/input-text.component';

@Component({
  selector: 'ng-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent extends LanguageChecker implements OnInit, AfterViewInit {

  constructor(private sessionService: SessionService,
              private updateViewService: UpdateViewService,
              private utilsService: UtilsService) {
    super();
  }

  @Input() openPublicChat: boolean = true;
  @Input() openPrivateChat: boolean = true;
  @Output() closeSidebar = new EventEmitter();
  @Output() newMessage = new EventEmitter();
  @ViewChild('chatContainer', {static: true}) chatContainer: ElementRef<HTMLElement>;
  @ViewChild(InputTextComponent, {static: false}) inputTextComponent: InputTextComponent;
  @ViewChildren('messageItem') messageItems: QueryList<any>;

  publicMessages: any[] = [];
  currentUser: RoomUser;
  chatText: string;
  replyMessage: any;
  pinnedMessage: any;
  isNearBottom = true;

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit() {
    this.messageItems.changes.subscribe(_ => this.onItemElementsChanged());
  }

  loadData() {
    this.currentUser = this.sessionService.currentUser;
    this.updateViewService.getViewEvent().subscribe(res => {
      switch (res.event) {
        case 'publicMessages':
          this.publicMessages = res.data;
          this.scrollDown();
          break;

        case 'newPublicMessage':
          this.publicMessages.push({message: res.data.message, user: res.data.user});
          if (this.sessionService.currentUser.id != res.data.user.id) {
            this.newMessage.emit();
          }
          this.scrollDown();
          break;

        case 'deletedMessage':
          const index = this.publicMessages.findIndex(p => p.message.id == res.data.message);
          this.publicMessages.splice(index, 1);
          break;

        case 'publicChatState':
          this.openPublicChat = res.data.value;
          const message = this.openPublicChat ? this.translations.room.chatAccessOpened : this.translations.room.chatAccessClosed;
          if (this.sessionService.imStudent) {
            this.utilsService.showToast({detail: message, severity: 'warn'});
          }
          break;
      }
    });
  }

  async sendMessage(callback?: () => any) {
    if (!this.chatText) {
      return;
    }
    const result = await this.sessionService.sendPublicMessage(this.chatText, this.replyMessage?.message?.id).toPromise();
    if (result.status == 'OK') {
      if (callback) {
        callback();
      }
      this.chatText = '';
      this.replyMessage = null;
      this.scrollDown();
    }
  }

  onReply(message: any) {
    this.replyMessage = message;
    this.focusInput();
  }

  async onDelete(message: any) {
    const dialogRes = await this.utilsService.showConfirm({
      message: this.translations.room.deletePublicMessageConfirm,
      rtl: this.fa
    });
    if (dialogRes) {
      try {
        await this.sessionService.deletePublicMessage(message.message.id).toPromise();
      } catch (error) {

      }
    }
  }

  onPin(message: any) {
    this.pinnedMessage = message;
  }

  cancelReply() {
    this.replyMessage = null;
  }

  getReplyMessageOf(message: any) {
    if (message.message.reply_to_message_id) {
      return this.publicMessages.find(m => m.message.id == message.message.reply_to_message_id);
    }
  }

  saveChat() {
  }

  async togglePublicChatActivation(chatActions: OverlayPanel) {
    await this.sessionService.changePublicChatState(!this.openPublicChat).toPromise();
    chatActions.hide();
  }

  togglePrivateChatActivation(activate: boolean) {
  }

  trackByFn(index: number, item: any): number {
    return item.id;
  }

  onItemElementsChanged(): void {
    if (this.isNearBottom) {
      this.scrollDown();
    }
  }

  isUserNearBottom(): boolean {
    const threshold = 150;
    const position = this.chatContainer.nativeElement.scrollTop + this.chatContainer.nativeElement.offsetHeight;
    const height = this.chatContainer.nativeElement.scrollHeight;
    return position > height - threshold;
  }

  scrollDown() {
    setTimeout(() => {
      this.chatContainer.nativeElement.scroll({
        top: this.chatContainer.nativeElement.scrollHeight,
        left: 0,
        behavior: 'smooth'
      });
    }, 50);
  }

  scrolled(): void {
    this.isNearBottom = this.isUserNearBottom();
  }

  focusInput() {
    this.inputTextComponent.focusInput();
  }
}
