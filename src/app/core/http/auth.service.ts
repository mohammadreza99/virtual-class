import {Injectable} from '@angular/core';
import {ApiService} from '@core/http';
import {Observable} from 'rxjs';
import {AuthLogin, AuthRegister, BaseRes, User} from '@core/models';

@Injectable({providedIn: 'root'})
export class AuthService extends ApiService {

  constructor() {
    super();
  }

  private _currentUser: User;

  getSelfUser(): Observable<BaseRes<any>> {
    return this._post('', {method: 'getSelf', data: {}});
  }

  register(data: AuthRegister): Observable<BaseRes<any>> {
    return this._post('', {method: 'createCompany', data});
  }

  login(data: AuthLogin): Observable<BaseRes<any>> {
    return this._post('', {method: 'login', data});
  }

  forgetPassword(email: string, company_id: number): Observable<BaseRes<any>> {
    return this._post('', {
      method: 'forgetPassword', data: {
        email,
        company_id
      }
    });
  }

  setPassword(password: string, token: string): Observable<BaseRes<any>> {
    return this._post('', {method: 'setPassword', data: {password, token}});
  }

  updatePassword(data: { current_password: string, new_password: string }): Observable<BaseRes<any>> {
    return this._post('', {method: 'updatePassword', data});
  }

  updateProfile(data: { first_name: string, last_name: string, nick_name: string }): Observable<BaseRes<any>> {
    return this._post('', {method: 'updateProfile', data});
  }

  logout(): void {
    localStorage.removeItem('token');
  }

  hasToken(): boolean {
    return !!localStorage.getItem('token');
  }

  isLimitMode(): boolean {
    return !!localStorage.getItem('limitMode');
  }

  set currentUser(data: User) {
    this._currentUser = data;
  }

  get currentUser(): User {
    return this._currentUser;
  }
}
