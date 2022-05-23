import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input, OnChanges, OnDestroy,
  OnInit,
  Output,
  QueryList,
  SimpleChanges,
  ViewChild,
  ViewChildren
} from '@angular/core';
import {RoomUser} from '@core/models';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {UtilsService} from '@ng/services';
import {SessionService} from '@core/http';
import {takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';

@Component({
  selector: 'ng-messenger',
  templateUrl: './messenger.component.html',
  styleUrls: ['./messenger.component.scss']
})
export class MessengerComponent extends LanguageChecker implements OnInit, OnChanges, AfterViewInit, OnDestroy {

  constructor(private el: ElementRef,
              private utilsService: UtilsService,
              private sessionService: SessionService) {
    super();
  }


  @Input() enableChat: boolean = true;
  @Input() pinnedMessage: any;
  @Input() messages: any[] = [];
  @Output() sendMessage = new EventEmitter();
  @Output() deleteMessage = new EventEmitter();
  @Output() pinMessage = new EventEmitter();
  @Output() muteUser = new EventEmitter();
  @ViewChild('chatContainer', {static: true}) chatContainer: ElementRef<HTMLElement>;
  @ViewChildren('messageItem') messageItems: QueryList<any>;

  currentUser: RoomUser;
  messageText: string = '';
  replyMessage: any;
  isNearBottom = true;
  destroy$: Subject<boolean> = new Subject<boolean>();
  emojiPickerVisible: boolean = false;

  ngOnInit(): void {
    this.currentUser = this.sessionService.currentUser;
  }

  ngOnChanges(changes: SimpleChanges): void {
  }

  ngAfterViewInit() {
    this.messageItems.changes.pipe(takeUntil(this.destroy$)).subscribe(_ => this.onItemElementsChanged());
  }

  sendMessageClick(callback: () => any) {
    if (!this.messageText) {
      callback();
      return;
    }
    this.sendMessage.emit({message: this.messageText, replyMessage: this.replyMessage, callback});
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
      this.deleteMessage.emit(message);
    }
  }

  pinMessageClick(message: any) {
    this.pinMessage.emit(message);
  }

  muteUserClick(message: any) {
    this.muteUser.emit(message);
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
    this.el.nativeElement.querySelector('ng-input-text input').focus();
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
}
