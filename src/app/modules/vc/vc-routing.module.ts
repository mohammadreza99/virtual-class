import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {VirtualClassPage} from '@modules/vc/pages/virtual-class/virtual-class.page';
import {RoomResolver, EnterRoomGuard} from '@core/guard';
import {RoomInfoPage} from '@modules/vc/pages/room-info/room-info.page';

const routes: Routes = [
  {
    path: 'room-info/:roomId',
    component: RoomInfoPage,
    data: {title: 'roomInfo'}
  },
  {
    path: ':roomId',
    component: VirtualClassPage,
    canActivate: [EnterRoomGuard],
    resolve: {data: RoomResolver},
    data: {title: 'room.virtualClass'}
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VcRoutingModule {
}
