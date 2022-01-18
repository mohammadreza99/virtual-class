import {Injectable} from '@angular/core';
import {ApiService} from './api.service';
import {Observable} from 'rxjs';
import {BaseRes, ListRes, PagerRes, SearchParam, UserOrGroup, User, Room, Group} from '@core/models';
import {map} from 'rxjs/operators';

@Injectable({providedIn: 'root'})
export class RoomService extends ApiService {

  constructor() {
    super();
  }

  getRooms(data: SearchParam | {} = {}): Observable<PagerRes<Room>> {
    return this._post<BaseRes<ListRes<Room>>>('', {method: 'listMyRooms', data}).pipe(map(item => ({
      items: item.data.items,
      total: item.data.meta.total
    })));
  }

  getRoomById(room_id: number): Observable<BaseRes<any>> {
    return this._post<BaseRes<Room>>('', {method: 'getRoom', data: {room_id}});
  }

  addRoom(data: Room): Observable<BaseRes<any>> {
    return this._post('', {method: 'createRoom', data});
  }

  updateRoom(data: Room): Observable<BaseRes<any>> {
    return this._post('', {method: 'updateRoom', data});
  }

  deleteRoom(room_id: number): Observable<BaseRes<any>> {
    return this._post('', {method: 'deleteRoom', data: {room_id}});
  }

  activateRoom(room_id: number, active: boolean): Observable<BaseRes<any>> {
    return this._post('', {method: 'activateRoom', data: {room_id, active}});
  }

  getRoomUsers(room_id: number, search: SearchParam | {} = {}): Observable<PagerRes<User>> {
    return this._post<BaseRes<ListRes<User>>>('', {
      method: 'getRoomUsers',
      data: {room_id, ...search}
    }).pipe(map(item => ({
      items: item.data.items,
      total: item.data.meta.total
    })));
  }

  getRoomGroups(room_id: number, search: SearchParam | {} = {}): Observable<PagerRes<Group>> {
    return this._post<BaseRes<ListRes<Group>>>('', {
      method: 'getRoomGroups',
      data: {room_id, ...search}
    }).pipe(map(item => ({
      items: item.data.items,
      total: item.data.meta.total
    })));
  }

  addUserOrGroupToRoom(room_id: number, user_or_groups: UserOrGroup[]): Observable<BaseRes<any>> {
    return this._post('', {method: 'addUserOrGroupToRoom', data: {room_id, user_or_groups}});
  }

  removeGroupFromRoom(room_id: number, group_id: number): Observable<BaseRes<any>> {
    return this._post('', {method: 'deleteGroupFromRoom', data: {room_id, group_id}});
  }

  removeUserFromRoom(room_id: number, user_id: number): Observable<BaseRes<any>> {
    return this._post('', {method: 'deleteUserFromRoom', data: {room_id, user_id}});
  }

  generateRoomLink(room_id: number): Observable<BaseRes<any>> {
    return this._post('', {method: 'generateRoomLink', data: {room_id}});
  }

  assignRole(room_id: number, user_id: number, role: 'Admin' | 'Viewer'): Observable<BaseRes<any>> {
    return this._post<any>('', {method: 'assignAdmin', data: {room_id, user_id, role}});
  }
}
