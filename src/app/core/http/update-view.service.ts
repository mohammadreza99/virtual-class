import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UpdateViewService {

  private updateViewSubject = new Subject<any>();

  constructor() {
  }

  setViewEvent(event: any) {
    this.updateViewSubject.next(event);
  }

  getViewEvent() {
    return this.updateViewSubject.asObservable();
  }

}
