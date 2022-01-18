import {Type} from '@angular/core';
import {LogoComponent} from '@shared/components/logo/logo.component';
import { PermissionDirective} from '@shared/directives/permission.directive';
import {PanelPermissionDirective} from '@shared/directives/panel-permission.directive';

export const COMPONENTS: Type<any>[] = [
  LogoComponent,
  PermissionDirective,
  PanelPermissionDirective
];
