import {Type} from '@angular/core';
import {VcContentComponent} from '@modules/vc/components/vc-content/vc-content.component';
import {VcSidebarComponent} from '@modules/vc/components/vc-sidebar/vc-sidebar.component';
import {VcFooterComponent} from '@modules/vc/components/vc-footer/vc-footer.component';
import {VcHeaderComponent} from '@modules/vc/components/vc-header/vc-header.component';
import {VirtualClassPage} from '@modules/vc/pages/virtual-class/virtual-class.page';
import {ScreenComponent} from '@modules/vc/components/screen/screen.component';
import {MainPlaceholderComponent} from '@modules/vc/components/main-placeholder/main-placeholder.component';
import {UserItemComponent} from '@modules/vc/components/user-item/user-item.component';
import {RoomInfoPage} from '@modules/vc/pages/room-info/room-info.page';
import {MessageItemComponent} from '@modules/vc/components/message-item/message-item.component';
import {KickUserConfirmComponent} from '@modules/vc/components/kick-user-confirm/kick-user-confirm.component';

export const COMPONENTS: Type<any>[] = [
  VirtualClassPage,
  RoomInfoPage,
  KickUserConfirmComponent,
  MessageItemComponent,
  UserItemComponent,
  MainPlaceholderComponent,
  ScreenComponent,
  VcContentComponent,
  VcSidebarComponent,
  VcFooterComponent,
  VcHeaderComponent
];
