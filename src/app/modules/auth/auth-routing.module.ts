import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {LoginPage} from './pages/login/login.page';
import {RegisterPage} from '@modules/auth/pages/register/register.page';
import {ForgetPasswordPage} from '@modules/auth/pages/forget-password/forget-password.page';
import {SetPasswordPage} from '@modules/auth/pages/set-password/set-password.page';

const routes: Routes = [
  {
    path: 'login',
    component: LoginPage,
    data: {title: 'login'}
  },
  {
    path: 'register',
    component: RegisterPage,
    data: {title: 'register'}
  },
  {
    path: 'forget-password',
    component: ForgetPasswordPage,
    data: {title: 'forgetPassword'}
  },
  {
    path: 'set-password/:token',
    component: SetPasswordPage,
    data: {title: 'setPassword'}
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthRoutingModule {
}
