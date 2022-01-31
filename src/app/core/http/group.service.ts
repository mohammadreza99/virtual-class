import {Injectable} from '@angular/core';
import {ApiService} from './api.service';
import {Observable} from 'rxjs';
import {BaseRes, ListRes, SearchParam, Group, GroupRelation, PagerRes, User, Room} from '@core/models';
import {map} from 'rxjs/operators';


@Injectable({providedIn: 'root'})
export class GroupService extends ApiService {

  constructor() {
    super();
  }

  getGroups(data: SearchParam | {} = {}): Observable<PagerRes<Group>> {
    return this._post<BaseRes<ListRes<Group>>>('', {method: 'searchGroup', data}).pipe(map(item => ({
      items: item.data.items,
      total: item.data.meta.total
    })));
  }

  addGroup(data: { name: string, user_ids: number[] }): Observable<BaseRes<any>> {
    return this._post('', {method: 'addGroup', data});
  }

  updateGroup(group_id: number, name: string): Observable<BaseRes<any>> {
    return this._post<any>('', {method: 'updateGroup', data: {group_id, name}});
  }

  deleteGroup(group_id: number): Observable<BaseRes<any>> {
    return this._post('', {method: 'deleteGroup', data: {group_id}});
  }

  activateGroup(group_id: number, active: boolean): Observable<BaseRes<any>> {
    return this._post('', {method: 'activateGroup', data: {group_id, active}});
  }

  getGroupUsers(group_id: number, search: SearchParam | {} = {}): Observable<PagerRes<User>> {
    return this._post<BaseRes<ListRes<User>>>('', {
      method: 'getGroupUsers',
      data: {group_id, ...search}
    }).pipe(map(item => ({
      items: item.data.items,
      total: item.data.meta.total
    })));
  }

  addUserToGroup(group_id: number, user_ids: number[]): Observable<BaseRes<any>> {
    return this._post('', {method: 'addUsersToGroup', data: {group_id, user_ids}});
  }

  removeUserFromGroup(group_id: number, user_ids: number[]): Observable<BaseRes<any>> {
    return this._post('', {method: 'deleteUsersFromGroup', data: {group_id, user_ids}});
  }

  getRelations(group_id: number): Observable<GroupRelation> {
    return this._post<BaseRes<GroupRelation>>('', {
      method: 'getGroupRelations',
      data: {group_id}
    }).pipe(map(item => item.data));
  }

  getGroupById(group_id: number): Observable<Group> {
    return this._post<BaseRes<Group>>('', {method: 'getGroup', data: {group_id}}).pipe(map(item => item.data));
  }

  assignRole(room_id: number, group_id: number, role: 'Admin' | 'Viewer') {
    return this._post<any>('', {
      method: 'assignAdminGroup',
      data: {room_id, group_id, role},
    });
  }
}
