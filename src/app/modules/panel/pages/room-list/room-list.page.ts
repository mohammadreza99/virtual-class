import {Component, OnInit} from '@angular/core';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {RoomService, SessionService, UserService} from '@core/http';
import {UtilsService} from '@ng/services';
import {Group, PagerRes, Room, SearchParam, TableConfig} from '@core/models';
import * as moment from 'jalali-moment';
import {Router} from '@angular/router';
import {UpdateViewService} from '@core/http/update-view.service';

@Component({
  selector: 'ng-room-list',
  templateUrl: './room-list.page.html',
  styleUrls: ['./room-list.page.scss']
})
export class RoomListPage extends LanguageChecker implements OnInit {

  constructor(private roomService: RoomService,
              private sessionService: SessionService,
              private updateViewService: UpdateViewService,
              private router: Router,
              private userService: UserService,
              private utilsService: UtilsService) {
    super();
  }

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
          header: this.translations.name,
          sortField: 'name'
        }, {
          header: this.translations.access,
          sortField: 'role'
        }, {
          header: this.translations.startDate,
          sortField: 'start_datetime'
        }, {
          header: this.translations.endDate,
          sortField: 'end_datetime'
        }, {
          header: this.translations.roomStatus,
          sortField: 'status'
        }, {
          header: this.translations.status,
          sortField: 'active'
        }, {
          header: this.translations.operations,
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
      const header = this.translations.deleteRoomConfirm;
      const message = this.translations.roomDeleteConfirmBody;
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
    const dialogRef = this.utilsService.showDialogForm(this.translations.editRoom,
      [
        {
          type: 'hidden',
          formControlName: 'room_id',
          value: room.id
        },
        {
          type: 'text',
          formControlName: 'name',
          label: this.translations.name,
          className: 'col-md-6',
          errors: [{type: 'required', message: this.translations.requiredField}],
          value: room.name
        },
        {
          type: 'text',
          formControlName: 'max_user',
          label: this.translations.membersCount,
          className: 'col-md-6',
          keyFilter: 'num',
          errors: [{type: 'required', message: this.translations.requiredField}],
          value: room.max_user
        },
        {
          type: 'date-picker',
          formControlName: 'start_datetime',
          label: this.translations.startDate,
          className: 'col-md-6',
          value: moment(new Date(room.start_datetime))
        },
        {
          type: 'date-picker',
          formControlName: 'end_datetime',
          label: this.translations.endDate,
          className: 'col-md-6',
          value: moment(new Date(room.end_datetime))
        },
        {
          type: 'switch',
          formControlName: 'private',
          label: this.translations.private,
          className: 'col-md-6',
          value: room.private
        },
      ], {width: '900px', rtl: this.fa}
    );
    dialogRef.onClose.subscribe(async (res: any) => {
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
      const dialogRef = this.utilsService.showDialogForm(this.translations.addRoom,
        [
          {
            type: 'text',
            formControlName: 'name',
            label: this.translations.name,
            className: 'col-md-6',
            errors: [{type: 'required', message: this.translations.requiredField}]
          },
          {
            type: 'dropdown',
            formControlName: 'admin_user_id',
            options: admins,
            label: this.translations.selectAdmin,
            className: 'col-md-6',
            errors: [{type: 'required', message: this.translations.requiredField}]
          },
          {
            type: 'date-picker',
            formControlName: 'start_datetime',
            label: this.translations.startDate,
            className: 'col-md-6'
          },
          {
            type: 'date-picker',
            formControlName: 'end_datetime',
            label: this.translations.endDate,
            className: 'col-md-6'
          },
          {
            type: 'number',
            formControlName: 'max_user',
            label: this.translations.membersCount,
            className: 'col-md-6',
            errors: [{type: 'required', message: this.translations.requiredField}]
          },
          {
            type: 'switch',
            formControlName: 'private',
            label: this.translations.private,
            className: 'col-md-6 align-self-center',
            labelPos: 'fix-side',
            value: false
          }
        ], {width: '900px', rtl: this.fa}
      );
      dialogRef.onClose.subscribe(async (res: any) => {
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
    const str = status.toLowerCase().replace(/_([a-z])/g, function (g) {
      return g[1].toUpperCase();
    });
    return this.translations[str];
  }
}
