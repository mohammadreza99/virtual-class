import {NgModule, Type} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {NotFoundComponent} from '@ng/components/not-found/not-found.component';
import {TranslationLoader} from '@core/guard/translation.loader';
import {ErrorComponent} from '@ng/components/error/error.component';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: (): Promise<Type<any>> =>
      import('./modules/auth/auth.module').then((m) => m.AuthModule),
    canLoad: [TranslationLoader],
  },
  {
    path: 'vc',
    loadChildren: (): Promise<Type<any>> =>
      import('./modules/vc/vc.module').then((m) => m.VcModule),
    canLoad: [TranslationLoader],
  },
  {
    path: '',
    loadChildren: (): Promise<Type<any>> =>
      import('./modules/panel/panel.module').then((m) => m.PanelModule),
    canLoad: [TranslationLoader],
  },
  {
    path: '404',
    component: NotFoundComponent,
  },
  {
    path: 'error',
    component: ErrorComponent,
  },
  {
    path: '',
    redirectTo: '',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/404',
    pathMatch: 'full',
  },
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
