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
  },
  {
    path: 'register',
    component: RegisterPage,
  },
  {
    path: 'forget-password',
    component: ForgetPasswordPage,
  },
  {
    path: 'set-password/:token',
    component: SetPasswordPage,
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
