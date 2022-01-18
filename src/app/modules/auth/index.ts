import {Type} from '@angular/core';
import {LoginPage} from './pages/login/login.page';
import {RegisterPage} from '@modules/auth/pages/register/register.page';
import {ForgetPasswordPage} from '@modules/auth/pages/forget-password/forget-password.page';
import {SetPasswordPage} from '@modules/auth/pages/set-password/set-password.page';

export const COMPONENTS: Type<any>[] = [
  LoginPage,
  RegisterPage,
  ForgetPasswordPage,
  SetPasswordPage
];
