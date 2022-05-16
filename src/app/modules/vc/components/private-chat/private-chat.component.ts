import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output, QueryList,
  ViewChild, ViewChildren
} from '@angular/core';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {SessionService} from '@core/http';
import {UpdateViewService} from '@core/http/update-view.service';
import {UtilsService} from '@ng/services';
import {InputTextComponent} from '@ng/components/input-text/input-text.component';
import {Subject} from 'rxjs';
import {RoomUser} from '@core/models';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'ng-private-chat',
  templateUrl: './private-chat.component.html',
  styleUrls: ['./private-chat.component.scss']
})
export class PrivateChatComponent extends LanguageChecker implements OnInit, AfterViewInit, OnDestroy {

  constructor(private sessionService: SessionService,
              private updateViewService: UpdateViewService,
              private utilsService: UtilsService) {
    super();
  }

  @Input() openChat: boolean = true;
  @Output() newMessage = new EventEmitter();
  @ViewChild('chatContainer', {static: true}) chatContainer: ElementRef<HTMLElement>;
  @ViewChild(InputTextComponent, {static: false}) inputTextComponent: InputTextComponent;
  @ViewChildren('messageItem') messageItems: QueryList<any>;

  destroy$: Subject<boolean> = new Subject<boolean>();
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
    this.messageItems.changes.pipe(takeUntil(this.destroy$)).subscribe(_ => this.onItemElementsChanged());
  }

  loadData() {
    this.currentUser = this.sessionService.currentUser;
    this.updateViewService.getViewEvent().pipe(takeUntil(this.destroy$)).subscribe(res => {
      switch (res.event) {
        case 'publicMessagesChange':
          this.publicMessages = res.data;
          this.scrollDown();
          break;

        case 'newMessage':
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
          this.openChat = res.data.value;
          const message = this.openChat ? this.instant('room.chatAccessOpened') : this.instant('room.chatAccessClosed');
          if (this.sessionService.imStudent) {
            this.utilsService.showToast({detail: message, severity: 'warn'});
          }
          break;
      }
    });
  }

  async sendMessage(callback?: () => any) {
    if (!this.chatText) {
      callback();
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
      header: this.instant('room.deleteMessage'),
      message: this.instant('room.deletePublicMessageConfirm'),
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

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  startChat(event: any) {

  }
}
