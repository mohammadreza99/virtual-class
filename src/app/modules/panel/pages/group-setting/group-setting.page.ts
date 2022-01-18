import {Component, OnInit} from '@angular/core';
import {GroupService} from '@core/http';
import {ActivatedRoute} from '@angular/router';
import {DialogService} from 'primeng/dynamicdialog';
import {UtilsService} from '@ng/services';
import {PagerRes, TableConfig, User} from '@core/models';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {AddGroupUserFormComponent} from '@modules/panel/components/add-group-user-form/add-group-user-form.component';
import {debounceTime} from 'rxjs/operators';

@Component({
  selector: 'ng-group-setting',
  templateUrl: './group-setting.page.html',
  styleUrls: ['./group-setting.page.scss']
})
export class GroupSettingPage extends LanguageChecker implements OnInit {

  constructor(private groupService: GroupService,
              private route: ActivatedRoute,
              private dialogService: DialogService,
              private utilsService: UtilsService) {
    super();
  }

  groupUsers: PagerRes<User>;
  groupUsersConfig: TableConfig;
  groupId: number;

  ngOnInit(): void {
    this.loadData();
  }

  async loadData() {
    try {
      this.groupId = +this.route.snapshot.paramMap.get('id');
      this.groupUsers = await this.groupService.getGroupUsers(this.groupId).toPromise();
      this.groupUsersConfig = {
        total: this.groupUsers.total,
        colDef: [
          {header: 'نام و نام خانوادگی'},
          {header: 'ایمیل'},
          {header: 'دسترسی'},
          {header: 'عملیات'},
        ],
      };
    } catch {

    }
  }

  async filterGroupUsers(event) {
    const value = event.target.value;
    if (value == '' || event.key == 'Enter') {
      this.groupUsers = await this.groupService.getGroupUsers(this.groupId, {search: value}).toPromise();
    }
  }

  async showAddUserModal() {
    this.dialogService.open(AddGroupUserFormComponent, {
      header: 'افزودن عضو',
      width: '900px'
    }).onClose.subscribe(async res => {
      try {
        if (res) {
          const result = await this.groupService.addUserToGroup(this.groupId, res).toPromise();
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
        header: 'تاییدیه حذف کاربر',
        message: 'آیا مایلید کاربر حذف شود؟',
        rtl: this.fa
      });
      if (dialogResult) {
        const res = await this.groupService.removeUserFromGroup(this.groupId, [user.id]).toPromise();
        const idx = this.groupUsers.items.findIndex(u => u.id == user.id);
        if (res.status === 'OK') {
          this.groupUsers.items.splice(idx, 1);
        }
      }
    } catch {
    }
  }
}
