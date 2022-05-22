import {EventEmitter, Input} from '@angular/core';
import {Component, OnInit, Output} from '@angular/core';
import {RoomUser} from '@core/models';
import {SessionService} from '@core/http';

@Component({
  selector: 'ng-contacts',
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.scss']
})
export class ContactsComponent implements OnInit {

  constructor(private sessionService: SessionService) {
  }

  @Input() contacts: RoomUser[] = [];
  @Output() goBack = new EventEmitter();
  @Output() selectContact = new EventEmitter();

  ngOnInit(): void {
    this.contacts = this.sessionService.getRoomUsers().filter(u => u.id != this.sessionService.currentUser.id);
  }

  goBackClick() {
    this.goBack.emit();
  }

  selectContactClick(user: RoomUser) {
    this.selectContact.emit(user);
  }
}
