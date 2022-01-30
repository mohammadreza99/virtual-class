import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {PanelPage} from './panel.page';
import {DashboardPage} from '@modules/panel/pages/dashboard/dashboard.page';
import {RoomListPage} from '@modules/panel/pages/room-list/room-list.page';
import {RoomSettingPage} from '@modules/panel/pages/room-setting/room-setting.page';
import {GroupListPage} from '@modules/panel/pages/group-list/group-list.page';
import {GroupSettingPage} from '@modules/panel/pages/group-setting/group-setting.page';
import {UserListPage} from '@modules/panel/pages/user-list/user-list.page';
import {ProfilePage} from '@modules/panel/pages/profile/profile.page';
import {CurrentUserResolver, LimitModeGuard} from '@core/guard';


const routes: Routes = [
  {
    path: '',
    component: PanelPage,
    data: {breadcrumb: 'home'},
    resolve: {data: CurrentUserResolver},
    canActivate: [LimitModeGuard],
    canActivateChild: [LimitModeGuard],
    children: [
      {
        path: 'dashboard',
        component: DashboardPage,
        data: {title: 'dashboard'}
      },
      {
        path: 'rooms',
        data: {breadcrumb: 'rooms'},
        children: [
          {
            path: 'list',
            component: RoomListPage,
            data: {title: 'roomList', breadcrumb: 'roomList'}
          },
          {
            path: 'setting/:id',
            component: RoomSettingPage,
            data: {title: 'roomManagement', breadcrumb: 'roomManagement'}
          },
          {
            path: '',
            redirectTo: 'list',
            pathMatch: 'full'
          },
        ]
      },
      {
        path: 'groups',
        data: {breadcrumb: 'groups'},
        children: [
          {
            path: 'list',
            component: GroupListPage,
            data: {title: 'groupList', breadcrumb: 'groupList'}
          },
          {
            path: 'setting/:id',
            component: GroupSettingPage,
            data: {title: 'groupManagement', breadcrumb: 'groupManagement'}
          },
          {
            path: '',
            redirectTo: 'list',
            pathMatch: 'full'
          },
        ]
      },
      {
        path: 'user-list',
        component: UserListPage,
        data: {title: 'userList', breadcrumb: 'userList'},
      },
      {
        path: 'profile',
        component: ProfilePage,
        data: {title: 'profileSetting', breadcrumb: 'profileSetting'},
      },
      {
        path: '',
        redirectTo: 'rooms',
        pathMatch: 'full'
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PanelRoutingModule {
}
