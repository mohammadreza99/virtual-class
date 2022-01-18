import {Injectable} from '@angular/core';
import {ApiService} from './api.service';
import {Observable} from 'rxjs';
import {BaseRes, ListRes, PagerRes, Group, SearchParam, User, UserRelation, GroupRelation} from '@core/models';
import {map} from 'rxjs/operators';

@Injectable({providedIn: 'root'})
export class UserService extends ApiService {

  constructor() {
    super();
  }

  getUsers(data: SearchParam | {} = {}): Observable<PagerRes<User>> {
    return this._post<BaseRes<ListRes<User>>>('', {method: 'searchUser', data}).pipe(map(item => ({
      items: item.data.items,
      total: item.data.meta.total
    })));
  }

  addUser(data: User): Observable<any> {
    return this._post('', {method: 'addUser', data});
  }

  updateUser(data: User): Observable<any> {
    return this._post('', {method: 'updateUser', data});
  }

  deleteUser(user_id: number): Observable<any> {
    return this._post('', {method: 'deleteUser', data: {user_id}});
  }

  activateUser(user_id: number, active: boolean): Observable<BaseRes<any>> {
    return this._post('', {method: 'activateUser', data: {user_id, active}});
  }

  resetPassword(email: string): Observable<any> {
    return this._post<any>('', {method: 'resetPassword', data: {email}}).pipe(map(d => d.data.password));
  }

  getRelations(user_id: number): Observable<UserRelation> {
    return this._post<BaseRes<UserRelation>>('', {
      method: 'getUserRelations',
      data: {user_id}
    }).pipe(map(item => item.data));
  }
}
