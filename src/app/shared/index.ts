import {Type} from '@angular/core';
import {LogoComponent} from '@shared/components/logo/logo.component';
import {PermissionDirective} from '@shared/directives/permission.directive';
import {PanelPermissionDirective} from '@shared/directives/panel-permission.directive';
import {UploadAvatarComponent} from '@shared/components/upload-avatar/upload-avatar.component';
import {CustomTableComponent} from '@shared/components/custom-table/custom-table.component';

export const COMPONENTS: Type<any>[] = [
  LogoComponent,
  PermissionDirective,
  PanelPermissionDirective,
  UploadAvatarComponent,
  CustomTableComponent
];
