import {Component, OnInit} from '@angular/core';
import {GroupService, UserService} from '@core/http';
import {UtilsService} from '@ng/services';
import {Group, GroupRelation, PagerRes, SearchParam, TableConfig} from '@core/models';
import {NgDropdownItem} from '@ng/models/forms';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {AddGroupFormComponent} from '@modules/panel/components/add-group-form/add-group-form.component';
import {DialogService} from 'primeng/dynamicdialog';
import {UserRelationsComponent} from '@modules/panel/components/user-relations/user-relations.component';

@Component({
  selector: 'ng-group-list',
  templateUrl: './group-list.page.html',
  styleUrls: ['./group-list.page.scss']
})
export class GroupListPage extends LanguageChecker implements OnInit {
  constructor(private groupService: GroupService,
              private userService: UserService,
              private utilsService: UtilsService,
              private dialogService: DialogService) {
    super();
  }

  rowData: PagerRes<Group>;
  tableConfig: TableConfig;
  admins: NgDropdownItem[];
  relations: GroupRelation;

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    try {
      this.rowData = await this.groupService.getGroups().toPromise();
      this.tableConfig = {
        total: this.rowData.total,
        colDef: [{
          header: this.translations.name,
          sortField: 'name'
        }, {
          header: this.translations.membersCount,
          sortField: 'user_count'
        }, {
          header: 'عضویت در کلاس یا اتاق',
          sortField: 'room_count'
        }, {
          header: 'وضعیت',
          sortField: 'active'
        }, {
          header: 'عملیات',
        }],
        onAdd: this.addGroup,
        onFetch: (data: SearchParam) => this.groupService.getGroups(data).toPromise()
      };
      const usersData = await this.userService.getUsers().toPromise();
      this.admins = usersData.items.map(a => ({label: `${a.first_name} ${a.last_name}`, value: a.id}));
    } catch {
    }
  }

  async changeGroupStatus(group: Group, activate: boolean) {
    try {
      const result = await this.groupService.activateGroup(group.id, activate).toPromise();
      if (result.status == 'OK') {
        group.active = activate;
      }
    } catch {

    }
  }

  editGroup(group: Group, index: number) {
    const dialogRef = this.utilsService.showDialogForm('ویرایش گروه',
      [
        {
          type: 'hidden',
          formControlName: 'group_id',
          value: group.id
        },
        {
          type: 'text',
          formControlName: 'name',
          label: 'نام',
          className: 'col-12',
          errors: [{type: 'required', message: 'این فیلد الزامیست'}],
          value: group.name
        },
      ], {width: '900px', rtl: this.fa}
    );
    dialogRef.onClose.subscribe(async (res: any) => {
      if (res) {
        const result = await this.groupService.updateGroup(res.group_id, res.name).toPromise();
        if (result.status == 'OK') {
          this.rowData.items[index] = result.data.group;
        }
      }
    });
  }

  async deleteGroup(group: Group) {
    try {
      this.relations = await this.groupService.getRelations(group.id).toPromise();
      if (this.relations.rooms.length) {
        this.dialogService.open(UserRelationsComponent, {
          data: this.relations,
          header: 'تاییدیه حذف گروه',
          rtl: this.fa
        }).onClose.subscribe(async res => {
          if (res) {
            await this.deleteGroupFromList(group);
          }
        });
      } else {
        const dialogRes = await this.utilsService.showConfirm({
          header: 'تاییدیه حذف گروه',
          message: 'ایا از حذف گروه مطمئن هستید؟',
          rtl: this.fa
        });
        if (dialogRes) {
          await this.deleteGroupFromList(group);
        }
      }
    } catch {
    }
  }

  addGroup = async () => {
    this.dialogService.open(AddGroupFormComponent, {
      header: 'افزودن گروه',
      width: '900px'
    }).onClose.subscribe(async res => {
      try {
        if (res) {
          const result = await this.groupService.addGroup(res).toPromise();
          if (result.status == 'OK') {
            this.rowData.items.unshift(result.data.group);
          }
        }
      } catch {

      }
    });
  };

  async deleteGroupFromList(group: Group) {
    await this.groupService.deleteGroup(group.id).toPromise();
    const index = this.rowData.items.findIndex(it => it.id === group.id);
    this.rowData.items.splice(index, 1);
  }
}
