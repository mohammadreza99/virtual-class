import {Component, OnDestroy, OnInit} from '@angular/core';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {ActivatedRoute} from '@angular/router';

import {Group, PagerRes, TableConfig, User} from '@core/models';
import {RoomService, UserService} from '@core/http';
import {DialogService} from 'primeng/dynamicdialog';
import {AddRoomUserFormComponent} from '@modules/panel/components/add-room-user-form/add-room-user-form.component';
import {AddRoomGroupFormComponent} from '@modules/panel/components/add-room-group-form/add-room-group-form.component';
import {UtilsService} from '@ng/services';
import {takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';

@Component({
  selector: 'ng-room-setting',
  templateUrl: './room-setting.page.html',
  styleUrls: ['./room-setting.page.scss']
})
export class RoomSettingPage extends LanguageChecker implements OnInit, OnDestroy {

  constructor(private roomService: RoomService,
              private route: ActivatedRoute,
              private dialogService: DialogService,
              private utilsService: UtilsService,
              private userService: UserService) {
    super();
  }

  destroy$: Subject<boolean> = new Subject<boolean>();
  roomUsers: PagerRes<User>;
  roomGroups: PagerRes<Group>;
  roomUsersConfig: TableConfig;
  roomGroupsConfig: TableConfig;
  allUsers: User[];
  roomId: number;
  clonedUsers: { [s: string]: any; } = {};
  clonedGroups: { [s: string]: any; } = {};

  ngOnInit(): void {
    this.loadData();
  }

  async loadData() {
    try {
      this.roomId = +this.route.snapshot.paramMap.get('id');
      const allUsers = await this.userService.getUsers().toPromise();
      const roomUsers = await this.roomService.getRoomUsers(this.roomId).toPromise();
      const roomGroups = await this.roomService.getRoomGroups(this.roomId).toPromise();
      roomUsers.items.forEach(x => Object.assign(x, {editing: false}));
      roomGroups.items.forEach(x => Object.assign(x, {editing: false}));
      this.allUsers = allUsers.items;
      this.roomUsers = roomUsers;
      this.roomGroups = roomGroups;
      this.roomUsersConfig = {
        total: this.roomUsers.total,
        colDef: [
          {header: this.instant('fullName')},
          {header: this.instant('email')},
          {header: this.instant('access')},
          {header: this.instant('operations')},
        ],
      };
      this.roomGroupsConfig = {
        total: this.roomGroups.total,
        colDef: [
          {header: this.instant('name')},
          {header: this.instant('membersCount')},
          {header: this.instant('access')},
          {header: this.instant('operations')},
        ],
      };
    } catch (error) {
    }
  }

  async filterRoomUsers(event) {
    const value = event.target.value;
    if (value == '' || event.key == 'Enter') {
      const result = await this.roomService.getRoomUsers(this.roomId, {search: value}).toPromise();
      result.items.forEach(x => Object.assign(x, {editing: false}));
      this.roomUsers = result;
    }
  }

  async filterRoomGroups(event) {
    const value = event.target.value;
    if (value == '' || event.key == 'Enter') {
      const result = await this.roomService.getRoomGroups(this.roomId, {search: value}).toPromise();
      result.items.forEach(x => Object.assign(x, {editing: false}));
      this.roomGroups = result;
    }
  }

  async showAddUserModal() {
    this.dialogService.open(AddRoomUserFormComponent, {
      header: this.instant('addMember'),
      width: '900px',
      rtl: this.fa
    }).onClose.pipe(takeUntil(this.destroy$)).subscribe(async res => {
      try {
        if (res) {
          const result = await this.roomService.addUserOrGroupToRoom(this.roomId, res).toPromise();
          if (result.status == 'OK') {
            await this.loadData();
          }
        }
      } catch {

      }
    });
  }

  async showAddGroupModal() {
    this.dialogService.open(AddRoomGroupFormComponent, {
      header: this.instant('addMember'),
      width: '900px',
      rtl: this.fa
    }).onClose.pipe(takeUntil(this.destroy$)).subscribe(async res => {
      try {
        if (res) {
          const result = await this.roomService.addUserOrGroupToRoom(this.roomId, res).toPromise();
          if (result.status == 'OK') {
            await this.loadData();
          }
        }
      } catch {

      }
    });
  }

  async removeUser(user: User) {
    try {
      const dialogResult = await this.utilsService.showConfirm({
        header: this.instant('deleteUserConfirm'),
        message: this.instant('deleteUserConfirmBody'),
        rtl: this.fa
      });
      if (dialogResult) {
        const result = await this.roomService.removeUserFromRoom(this.roomId, user.id).toPromise();
        const idx = this.roomUsers.items.findIndex(u => u.id == user.id);
        if (result.status === 'OK') {
          this.roomUsers.items.splice(idx, 1);
        }
      }
    } catch {
    }
  }

  async removeGroup(group: Group) {
    try {
      const dialogResult = await this.utilsService.showConfirm({
        header: this.instant('deleteGroupConfirm'),
        message: this.instant('deleteGroupConfirmBody'),
        rtl: this.fa
      });
      if (dialogResult) {
        const result = await this.roomService.removeGroupFromRoom(this.roomId, group.id).toPromise();
        const idx = this.roomGroups.items.findIndex(u => u.id == group.id);
        if (result.status === 'OK') {
          this.roomGroups.items.splice(idx, 1);
        }
      }
    } catch {
    }
  }

  editUserRole(item: any) {
    this.clonedUsers[item.id] = {...item};
    item.editing = true;
  }

  cancelUserEditing(item: any, index: number) {
    item.editing = false;
    this.roomUsers.items[index] = this.clonedUsers[item.id];
    delete this.clonedUsers[item.id];
  }

  async submitUserEditing(item: any) {
    delete this.clonedUsers[item.id];
    await this.roomService.assignRole(this.roomId, item.id, item.role).toPromise();
    item.editing = false;
  }

  editGroupRole(item: any) {
    this.clonedGroups[item.id] = {...item};
    item.editing = true;
  }

  cancelGroupEditing(item: any, index: number) {
    item.editing = false;
    this.roomGroups.items[index] = this.clonedGroups[item.id];
    delete this.clonedGroups[item.id];
  }

  async submitGroupEditing(item: any) {
    delete this.clonedUsers[item.id];
    await this.roomService.assignRole(this.roomId, item.id, item.role).toPromise();
    item.editing = false;
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
