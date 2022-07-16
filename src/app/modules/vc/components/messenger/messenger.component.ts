import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit, Output,
  QueryList,
  ViewChild,
  ViewChildren,
  EventEmitter
} from '@angular/core';
import {RoomUser} from '@core/models';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {UtilsService} from '@ng/services';
import {SessionService} from '@core/http';
import {takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {UpdateViewService} from '@core/utils';

@Component({
  selector: 'ng-messenger',
  templateUrl: './messenger.component.html',
  styleUrls: ['./messenger.component.scss']
})
export class MessengerComponent extends LanguageChecker implements OnInit, AfterViewInit, OnDestroy {

  constructor(private el: ElementRef,
              private utilsService: UtilsService,
              private updateViewService: UpdateViewService,
              private sessionService: SessionService) {
    super();
  }

  @Input() type: 'public' | 'private';
  @Input() enableChat: boolean = true;
  @ViewChild('chatContainer', {static: true}) chatContainer: ElementRef<HTMLElement>;
  @ViewChildren('messageItem') messageItems: QueryList<any>;

  pinnedMessage: any;
  messages: any[] = [];
  currentUser: RoomUser;
  messageText: string = '';
  replyMessage: any;
  isNearBottom = true;
  destroy$: Subject<boolean> = new Subject<boolean>();
  emojiPickerVisible: boolean = false;
  currentPVId: number;

  ngOnInit(): void {
    this.currentUser = this.sessionService.currentUser;
    this.loadData();
  }

  async loadData() {
    this.updateViewService.getViewEvent().pipe(takeUntil(this.destroy$)).subscribe(res => {
      if (this.type == 'private') {
        switch (res.event) {
          case 'privateMessagesChange':
            this.messages = res.data.messages;
            this.currentPVId = res.data.pvId;
            break;

          case 'newPVMessage':
            this.currentPVId = res.data.pv_id;
            this.messages.push({message: res.data.message, user: res.data.user});
            this.updateViewService.setViewEvent({event: 'gotNewPrivateMessage', data: true});
            break;

          case 'privateChatState':
            this.enableChat = res.data.value;
            break;
        }
      } else if (this.type == 'public') {
        switch (res.event) {
          case 'publicMessagesChange':
            this.messages = res.data.messages;
            this.pinnedMessage = res.data.pinnedMessage;
            break;

          case 'newMessage':
            this.messages.push({message: res.data.message, user: res.data.user});
            this.updateViewService.setViewEvent({event: 'gotNewPublicMessage', data: true});
            break;

          case 'deletedMessage':
            const index = this.messages.findIndex(p => p.message.id == res.data.message);
            this.messages.splice(index, 1);
            break;

          case 'publicChatState':
            this.enableChat = res.data.value;
            break;

          case 'clearPublicMessages':
            this.messages = [];
            this.pinnedMessage = null;
            break;

          case 'pinnedMessage':
            this.pinnedMessage = res.data.message;
            break;

          case 'messageMutedUser':
            if (this.sessionService.currentUser.id == res.data.user_id) {
              this.enableChat = res.data.state;
            }
            break;

          case 'unpinnedMessage':
            this.pinnedMessage = null;
            break;
        }
      }
    });
  }

  ngAfterViewInit() {
    this.messageItems.changes.pipe(takeUntil(this.destroy$)).subscribe(_ => this.onItemElementsChanged());
  }

  async sendMessageClick(callback: () => any) {
    if (!this.messageText) {
      if (callback) {
        callback();
      }
      return;
    }
    if (this.type == 'public') {
      await this.sessionService.sendPublicMessage(this.messageText, this.replyMessage?.message?.id).toPromise();
    } else if (this.type == 'private') {
      await this.sessionService.sendPVMessage(this.currentPVId, this.messageText, this.replyMessage?.message?.id).toPromise();
    }
    if (callback) {
      callback();
    }
    this.messageText = '';
    this.replyMessage = null;
    this.scrollDown();
  }

  replyMessageClick(message: any) {
    this.replyMessage = message;
    this.focusInput();
  }

  async deleteMessageClick(message: any) {
    const dialogRes = await this.utilsService.showConfirm({
      header: this.instant('room.deleteMessage'),
      message: this.instant('room.deletePublicMessageConfirm'),
      rtl: this.fa
    });
    if (dialogRes) {
      await this.sessionService.deletePublicMessage(message.message.id).toPromise();
    }
  }

  async pinMessageClick(message: any) {
    await this.sessionService.pinPublicMessage(message.message.id).toPromise();
  }

  async muteUserClick(message: any) {
    await this.sessionService.changeUserMessageState(message.user.id, !message.user.user_message_state).toPromise();
  }

  cancelReply() {
    this.replyMessage = null;
  }

  getReplyMessageOf(message: any) {
    if (message.message.reply_to_message_id) {
      return this.messages.find(m => m.message.id == message.message.reply_to_message_id);
    }
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
    }, 100);
  }

  scrolled(): void {
    this.isNearBottom = this.isUserNearBottom();
  }

  focusInput() {
    this.textareaEl.focus();
  }

  addEmoji(event) {
    this.messageText += event.emoji.native;
    this.emojiPickerVisible = false;
    this.focusInput();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  toggleEmojiPicker() {
    this.emojiPickerVisible = !this.emojiPickerVisible;
  }

  unpinPublicMessage() {
    this.sessionService.unpinPublicMessage().toPromise();
  }

  onInputChange(event: any) {
    this.messageText = event.target.value;
    this.textareaEl.style.height = (this.textareaEl.scrollHeight + 2) + 'px';
  }

  onKeydown(event: any) {
    this.setTextareaDirection();
    if ((event.code == 'Enter' || event.code == 'NumpadEnter') && !event.shiftKey) {
      event.preventDefault();
      this.sendMessageClick(null);
      this.textareaEl.style.height = '44px';
      this.textareaEl.value = '';
    }
  }

  get textareaEl() {
    return this.el.nativeElement.querySelector('ng-input-textarea textarea');
  }

  setTextareaDirection() {
    const rgx = /^[-!$%^&*()_+|~=`{}\[\]:\";'<>?,.\/]*[A-Za-z]/; // is ascii
    const isAscii = rgx.test(this.textareaEl.value);

    if (isAscii) {
      this.textareaEl.style.direction = 'ltr';
      this.textareaEl.style.textAlign = 'left';
    } else {
      this.textareaEl.style.direction = 'rtl';
      this.textareaEl.style.textAlign = 'right';
    }
  };
}
