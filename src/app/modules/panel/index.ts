import {Type} from '@angular/core';
import {PanelPage} from '@modules/panel/panel.page';
import {DashboardPage} from '@modules/panel/pages/dashboard/dashboard.page';
import {RoomListPage} from '@modules/panel/pages/room-list/room-list.page';
import {RoomSettingPage} from '@modules/panel/pages/room-setting/room-setting.page';
import {GroupListPage} from '@modules/panel/pages/group-list/group-list.page';
import {GroupSettingPage} from '@modules/panel/pages/group-setting/group-setting.page';
import {UserListPage} from '@modules/panel/pages/user-list/user-list.page';
import {ProfilePage} from '@modules/panel/pages/profile/profile.page';
import {AddRoomGroupFormComponent} from '@modules/panel/components/add-room-group-form/add-room-group-form.component';
import {AddRoomUserFormComponent} from '@modules/panel/components/add-room-user-form/add-room-user-form.component';
import {AddGroupFormComponent} from '@modules/panel/components/add-group-form/add-group-form.component';
import {AddGroupUserFormComponent} from '@modules/panel/components/add-group-user-form/add-group-user-form.component';
import {NavbarMenuComponent} from '@modules/panel/components/navbar-menu/navbar-menu.component';
import {GroupRelationsComponent} from '@modules/panel/components/group-relations/group-relations.component';
import {UserRelationsComponent} from '@modules/panel/components/user-relations/user-relations.component';

export const COMPONENTS: Type<any>[] = [
  AddRoomGroupFormComponent,
  AddRoomUserFormComponent,
  AddGroupUserFormComponent,
  AddGroupFormComponent,
  GroupRelationsComponent,
  UserRelationsComponent,
  NavbarMenuComponent,
  PanelPage,
  DashboardPage,
  RoomListPage,
  RoomSettingPage,
  GroupListPage,
  GroupSettingPage,
  UserListPage,
  ProfilePage
];
