import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {NgPosition} from '@ng/models/offset';
import {OverlayPanel} from 'primeng/overlaypanel';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {RoomUser} from '@core/models';
import {SessionService} from '@core/http';

@Component({
  selector: 'ng-message-item',
  templateUrl: './message-item.component.html',
  styleUrls: ['./message-item.component.scss']
})
export class MessageItemComponent extends LanguageChecker implements OnInit {

  constructor(private sessionService: SessionService) {
    super();
  }

  @Input() position: NgPosition = 'left';
  @Input() message: any;
  @Input() sender: any;
  @Input() replyMessage: any;
  @Input() showMoreOptions: boolean = true;
  @Output() reply = new EventEmitter();
  @Output() delete = new EventEmitter();
  @Output() pin = new EventEmitter();
  @Output() mute = new EventEmitter();

  currentUser: RoomUser;

  ngOnInit(): void {
    this.currentUser = this.sessionService.currentUser;
  }

  onReply(messageActions?: OverlayPanel) {
    if (messageActions) {
      messageActions.hide();
    }
    this.reply.emit();
  }

  onDelete(messageActions: OverlayPanel) {
    messageActions.hide();
    this.delete.emit();
  }

  muteUser(messageActions: OverlayPanel) {
    messageActions.hide();
    this.sender.user_message_state = !this.sender.user_message_state;
    this.mute.emit();
  }

  onPin(messageActions: OverlayPanel) {
    messageActions.hide();
    this.pin.emit();
  }
}
