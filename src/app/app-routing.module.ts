import {NgModule, Type} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {NotFoundComponent} from '@ng/components/not-found/not-found.component';
import {ErrorComponent} from '@ng/components/error/error.component';
import {NoInternetComponent} from '@shared/components/no-internet/no-internet.component';

export const routes: Routes = [
  {
    path: 'no-internet',
    component: NoInternetComponent,
  },
  {
    path: 'auth',
    loadChildren: (): Promise<Type<any>> =>
      import('./modules/auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: 'vc',
    loadChildren: (): Promise<Type<any>> =>
      import('./modules/vc/vc.module').then((m) => m.VcModule),
  },
  {
    path: '',
    loadChildren: (): Promise<Type<any>> =>
      import('./modules/panel/panel.module').then((m) => m.PanelModule),
  },
  {
    path: 'error',
    component: ErrorComponent,
  },
  {
    path: '404',
    component: NotFoundComponent,
  },
  {
    path: '',
    redirectTo: '',
    pathMatch: 'full',
  },
  // {
  //   path: '**',
  //   redirectTo: '404',
  //   pathMatch: 'full',
  // },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'top',
      useHash: true
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {
}
