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
import {CurrentUserResolver} from '@core/guard';

const routes: Routes = [
  {
    path: '',
    component: PanelPage,
    resolve: {data: CurrentUserResolver},
    children: [
      {
        path: 'dashboard',
        component: DashboardPage,
      },
      {
        path: 'room-list',
        component: RoomListPage
      },
      {
        path: 'room-setting/:id',
        component: RoomSettingPage
      },
      {
        path: 'group-list',
        component: GroupListPage,
      },
      {
        path: 'group-setting/:id',
        component: GroupSettingPage,
      },
      {
        path: 'user-list',
        component: UserListPage
      },
      {
        path: 'profile',
        component: ProfilePage
      },
      {
        path: '',
        redirectTo: 'room-list',
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
