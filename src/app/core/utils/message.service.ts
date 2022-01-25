import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';
import {NgMessage} from '@ng/models/overlay';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  constructor() {
  }

  private _newMessage = new Subject<NgMessage>();

  nextMessage(message: NgMessage) {
    this._newMessage.next(message);
  }

  getMessage() {
    return this._newMessage.asObservable();
  }
}
