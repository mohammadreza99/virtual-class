import {Component, Input, OnInit} from '@angular/core';
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
  @Input() message: { sender: string, time: string, text: string };

  ngOnInit(): void {
  }

  getColor() {
    return this.sessionService.getProfileColor(+this.message.sender);
  }
}
