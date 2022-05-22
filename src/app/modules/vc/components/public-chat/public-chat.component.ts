import {Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {SessionService} from '@core/http';
import {UpdateViewService} from '@core/utils';
import {UtilsService} from '@ng/services';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';

@Component({
  selector: 'ng-public-chat',
  templateUrl: './public-chat.component.html',
  styleUrls: ['./public-chat.component.scss']
})
export class PublicChatComponent extends LanguageChecker implements OnInit, OnDestroy {
  constructor(private sessionService: SessionService,
              private updateViewService: UpdateViewService,
              private utilsService: UtilsService) {
    super();
  }

  @Input() openChat: boolean;
  @Output() newMessage = new EventEmitter();

  destroy$: Subject<boolean> = new Subject<boolean>();
  messages: any[] = [];
  pinnedMessage: any;

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.updateViewService.getViewEvent().pipe(takeUntil(this.destroy$)).subscribe(res => {
      switch (res.event) {
        case 'publicMessagesChange':
          this.messages = res.data;
          break;

        case 'newMessage':
          this.messages.push({message: res.data.message, user: res.data.user});
          if (this.sessionService.currentUser.id != res.data.user.id) {
            this.newMessage.emit();
          }
          break;

        case 'deletedMessage':
          const index = this.messages.findIndex(p => p.message.id == res.data.message);
          this.messages.splice(index, 1);
          break;

        case 'publicChatState':
          this.openChat = res.data.value;
          const message = this.openChat ? this.instant('room.chatAccessOpened') : this.instant('room.chatAccessClosed');
          if (this.sessionService.imStudent) {
            this.utilsService.showToast({detail: message, severity: 'warn'});
          }
          break;

        case 'pinnedMessage':
          this.pinnedMessage = res.data.message;
          break;
      }
    });
  }

  async sendMessage(event: any) {
    const {message, replyMessage, callback} = event;
    const result = await this.sessionService.sendPublicMessage(message, replyMessage?.message?.id).toPromise();
    if (result.status == 'OK') {
      if (callback) {
        callback();
      }
    }
  }

  async onDelete(event: any) {
    try {
      await this.sessionService.deletePublicMessage(event.message.id).toPromise();
    } catch (error) {

    }
  }

  async muteUser(event: any) {
    try {
      await this.sessionService.muteUserMessage(event.user.id).toPromise();
    } catch (error) {

    }
  }

  async pinMessage(event: any) {
    try {
      await this.sessionService.pinPublicMessage(event.message.id).toPromise();
    } catch (error) {

    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

}
