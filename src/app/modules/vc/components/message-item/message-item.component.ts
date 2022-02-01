import {Component, Input, OnInit, Output, EventEmitter} from '@angular/core';
import {NgPosition} from '@ng/models/offset';
import {SessionService} from '@core/http';

@Component({
  selector: 'ng-message-item',
  templateUrl: './message-item.component.html',
  styleUrls: ['./message-item.component.scss']
})
export class MessageItemComponent implements OnInit {

  constructor(private sessionService: SessionService) {
  }

  @Input() position: NgPosition = 'left';
  @Input() message: any;
  @Input() sender: any;
  @Input() replyMessage: any;
  @Output() reply = new EventEmitter();

  ngOnInit(): void {
  }

  getColor() {
    return this.sessionService.getProfileColor(+this.sender.id);
  }
}
