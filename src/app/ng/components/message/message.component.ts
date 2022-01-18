import {Component, OnInit} from '@angular/core';
import {NgMessage, NgMessageOptions} from '@ng/models/overlay';

@Component({
  selector: 'ng-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss'],
})
export class MessageComponent {
  messages: NgMessage[] = [];
  options: NgMessageOptions = {
    closable: true
  };
}
