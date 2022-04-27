import {Type} from '@angular/core';
import {LogoComponent} from '@shared/components/logo/logo.component';
import {PermissionDirective} from '@shared/directives/permission.directive';
import {PanelPermissionDirective} from '@shared/directives/panel-permission.directive';
import {UploadAvatarComponent} from '@shared/components/upload-avatar/upload-avatar.component';
import {CustomTableComponent} from '@shared/components/custom-table/custom-table.component';
import {AvatarComponent} from '@shared/components/avatar/avatar.component';
import {FileSizePipe} from '@shared/pipe/file-size.pipe';
import {NoInternetComponent} from '@shared/components/no-internet/no-internet.component';
import {TemplateDirective} from '@shared/directives/template.directive';

export const COMPONENTS: Type<any>[] = [
  LogoComponent,
  PermissionDirective,
  PanelPermissionDirective,
  UploadAvatarComponent,
  AvatarComponent,
  CustomTableComponent,
  FileSizePipe,
  NoInternetComponent,
  TemplateDirective
];
