import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoaderService {
  constructor() {
  }

  isLoading = new BehaviorSubject(false);
}
