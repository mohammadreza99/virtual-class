import {Component, Input, OnInit, Output, EventEmitter} from '@angular/core';
import {NgPosition} from '@ng/models/offset';
import {SessionService} from '@core/http';
import {OverlayPanel} from 'primeng/overlaypanel';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';

@Component({
  selector: 'ng-message-item',
  templateUrl: './message-item.component.html',
  styleUrls: ['./message-item.component.scss']
})
export class MessageItemComponent extends LanguageChecker implements OnInit {

  constructor() {
    super();
  }

  @Input() position: NgPosition = 'left';
  @Input() message: any;
  @Input() sender: any;
  @Input() replyMessage: any;
  @Output() reply = new EventEmitter();
  @Output() delete = new EventEmitter();
  @Output() pin = new EventEmitter();

  ngOnInit(): void {
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

  onPin(messageActions: OverlayPanel) {
    messageActions.hide();
    this.pin.emit();
  }
}
