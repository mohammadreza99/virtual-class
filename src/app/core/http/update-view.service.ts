import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';
import {RoomEventType} from '@core/models';

@Injectable({
  providedIn: 'root'
})
export class UpdateViewService {

  private updateViewSubject = new Subject<any>();

  constructor() {
  }

  setViewEvent(event: { event: RoomEventType, data: any }) {
    this.updateViewSubject.next(event);
  }

  getViewEvent() {
    return this.updateViewSubject.asObservable();
  }

}
