import {Component, Input} from '@angular/core';

@Component({
  selector: 'ng-private-chat-item',
  templateUrl: './private-chat-item.component.html',
  styleUrls: ['./private-chat-item.component.scss']
})
export class PrivateChatItemComponent {

  @Input() pvItem: any;
}
