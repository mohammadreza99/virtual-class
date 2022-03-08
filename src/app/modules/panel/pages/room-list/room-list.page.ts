import {Component, OnDestroy, OnInit} from '@angular/core';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {RoomService, SessionService, UserService} from '@core/http';
import {UtilsService} from '@ng/services';
import {Group, PagerRes, Room, SearchParam, TableConfig} from '@core/models';
import * as moment from 'jalali-moment';
import {Router} from '@angular/router';
import {UpdateViewService} from '@core/http/update-view.service';
import {takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';

@Component({
  selector: 'ng-room-list',
  templateUrl: './room-list.page.html',
  styleUrls: ['./room-list.page.scss']
})
export class RoomListPage extends LanguageChecker implements OnInit, OnDestroy {

  constructor(private roomService: RoomService,
              private sessionService: SessionService,
              private updateViewService: UpdateViewService,
              private router: Router,
              private userService: UserService,
              private utilsService: UtilsService) {
    super();
  }

  destroy$: Subject<boolean> = new Subject<boolean>();
  rowData: PagerRes<Room>;
  tableConfig: TableConfig;

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    try {
      this.rowData = await this.roomService.getRooms().toPromise();
      this.tableConfig = {
        total: this.rowData.total,
        colDef: [{
          header: this.instant('name'),
          sortField: 'name'
        }, {
          header: this.instant('access'),
          sortField: 'role'
        }, {
          header: this.instant('startDate'),
          sortField: 'start_datetime'
        }, {
          header: this.instant('endDate'),
          sortField: 'end_datetime'
        }, {
          header: this.instant('roomStatus'),
          sortField: 'status'
        }, {
          header: this.instant('status'),
          sortField: 'active'
        }, {
          header: this.instant('operations'),
        }],
        onAdd: this.addRoom,
        onFetch: (data: SearchParam) => this.roomService.getRooms(data).toPromise()
      };
    } catch {
    }
  }

  async changeRoomStatus(room: Group, activate: boolean) {
    try {
      const result = await this.roomService.activateRoom(room.id, activate).toPromise();
      if (result.status == 'OK') {
        room.active = activate;
      }
    } catch {

    }
  }

  async deleteRoom(room: Group) {
    try {
      const header = this.instant('deleteRoomConfirm');
      const message = this.instant('roomDeleteConfirmBody');
      const dialogRes = await this.utilsService.showConfirm({header, message, rtl: this.fa});
      if (dialogRes) {
        const result = await this.roomService.deleteRoom(room.id).toPromise();
        if (result.status == 'OK') {
          const index = this.rowData.items.findIndex(it => it.id === room.id);
          this.rowData.items.splice(index, 1);
        }
      }
    } catch {
    }
  }

  editRoom(room: Room, index: number) {
    const dialogRef = this.utilsService.showDialogForm(this.instant('editRoom'),
      [
        {
          type: 'hidden',
          formControlName: 'room_id',
          value: room.id
        },
        {
          type: 'text',
          formControlName: 'name',
          label: this.instant('name'),
          className: 'col-md-6',
          errors: [{type: 'required', message: this.instant('requiredField')}],
          value: room.name
        },
        {
          type: 'text',
          formControlName: 'max_user',
          label: this.instant('membersCount'),
          className: 'col-md-6',
          keyFilter: 'num',
          errors: [{type: 'required', message: this.instant('requiredField')}],
          value: room.max_user
        },
        {
          type: 'date-picker',
          formControlName: 'start_datetime',
          label: this.instant('startDate'),
          className: 'col-md-6',
          value: moment(new Date(room.start_datetime))
        },
        {
          type: 'date-picker',
          formControlName: 'end_datetime',
          label: this.instant('endDate'),
          className: 'col-md-6',
          value: moment(new Date(room.end_datetime))
        },
        {
          type: 'switch',
          formControlName: 'private',
          label: this.instant('private'),
          className: 'col-md-6',
          value: room.private
        },
      ], {width: '900px', rtl: this.fa}
    );
    dialogRef.onClose.pipe(takeUntil(this.destroy$)).subscribe(async (res: any) => {
      if (res) {
        const result = await this.roomService.updateRoom(res).toPromise();
        if (result.status == 'OK') {
          this.rowData.items[index] = result.data.room;
        }
      }
    });
  }

  addRoom = async () => {
    try {
      const usersData = await this.userService.getUsers({limit: 1000}).toPromise();
      const admins = usersData.items.map(a => ({label: `${a.first_name} ${a.last_name}`, value: a.id}));
      const dialogRef = this.utilsService.showDialogForm(this.instant('addRoom'),
        [
          {
            type: 'text',
            formControlName: 'name',
            label: this.instant('name'),
            className: 'col-md-6',
            errors: [{type: 'required', message: this.instant('requiredField')}]
          },
          {
            type: 'dropdown',
            formControlName: 'admin_user_id',
            options: admins,
            label: this.instant('selectAdmin'),
            className: 'col-md-6',
            errors: [{type: 'required', message: this.instant('requiredField')}]
          },
          {
            type: 'date-picker',
            formControlName: 'start_datetime',
            label: this.instant('startDate'),
            className: 'col-md-6'
          },
          {
            type: 'date-picker',
            formControlName: 'end_datetime',
            label: this.instant('endDate'),
            className: 'col-md-6'
          },
          {
            type: 'number',
            formControlName: 'max_user',
            label: this.instant('membersCount'),
            className: 'col-md-6',
            errors: [{type: 'required', message: this.instant('requiredField')}]
          },
          {
            type: 'switch',
            formControlName: 'private',
            label: this.instant('private'),
            className: 'col-md-6 align-self-center',
            labelPos: 'fix-side',
            value: false
          }
        ], {width: '900px', rtl: this.fa}
      );
      dialogRef.onClose.pipe(takeUntil(this.destroy$)).subscribe(async (res: any) => {
        if (res) {
          const result = await this.roomService.addRoom(res).toPromise();
          if (result.status == 'OK') {
            this.rowData.items.unshift(result.data.room);
          }
        }
      });
    } catch {

    }
  };

  async copyRoomLink(roomId: number) {
    const data = await this.roomService.generateRoomLink(roomId).toPromise();
    await navigator.clipboard.writeText(data.data.link);
  }

  getTranslated(status: string) {
    const str = status.toLowerCase().replace(/_([a-z])/g, function(g) {
      return g[1].toUpperCase();
    });
    return this.instant(str);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
