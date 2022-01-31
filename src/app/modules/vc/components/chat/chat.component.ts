import {
  Component,
  ComponentFactoryResolver,
  EventEmitter,
  OnInit,
  Output,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import {MessageItemComponent} from '@modules/vc/components/message-item/message-item.component';
import {SessionService} from '@core/http';
import {RoomUser} from '@core/models';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';

@Component({
  selector: 'ng-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent extends LanguageChecker implements OnInit {

  constructor(private sessionService: SessionService,
              private resolver: ComponentFactoryResolver) {
    super();
  }

  currentUser: RoomUser;
  chatText: string;
  @Output() closeSidebar = new EventEmitter();
  @ViewChild('chatItemContainer', {static: true, read: ViewContainerRef}) chatContainer: ViewContainerRef;

  ngOnInit(): void {
    this.currentUser = this.sessionService.currentUser;
  }

  async sendMessage(container: HTMLElement) {
    if (this.chatText) {
      const result = this.sessionService.sendPublicMessage(this.chatText).toPromise();
      const factory = this.resolver.resolveComponentFactory(MessageItemComponent);
      const cmpRef = this.chatContainer.createComponent(factory);
      cmpRef.instance.position = 'right';
      cmpRef.instance.message = {text: this.chatText, sender: this.currentUser.first_name, time: '12:23'};
      this.chatText = '';
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 0);
    }
  }

}
