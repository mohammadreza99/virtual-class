import {Component, OnInit} from '@angular/core';
import {UserService} from '@core/http';
import {UtilsService} from '@ng/services';
import {ConfirmationService} from 'primeng/api';
import {DialogService} from 'primeng/dynamicdialog';
import {PagerRes, SearchParam, TableConfig, User, UserRelation} from '@core/models';
import {AddGroupFormComponent} from '@modules/panel/components/add-group-form/add-group-form.component';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {UserRelationsComponent} from '@modules/panel/components/user-relations/user-relations.component';

@Component({
  selector: 'ng-user-list',
  templateUrl: './user-list.page.html',
  styleUrls: ['./user-list.page.scss']
})
export class UserListPage extends LanguageChecker implements OnInit {

  constructor(private userService: UserService,
              private utilsService: UtilsService,
              private dialogService: DialogService) {
    super();
  }

  rowData: PagerRes<User>;
  tableConfig: TableConfig;
  relations: UserRelation;

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    try {
      this.rowData = await this.userService.getUsers().toPromise();
      this.tableConfig = {
        total: this.rowData.total,
        colDef: [{
          header: 'نام',
          sortField: 'first_name'
        }, {
          header: 'نام خانوادگی',
          sortField: 'last_name'
        }, {
          header: 'ایمیل',
          sortField: 'email'
        }, {
          header: 'موبایل',
          sortField: 'phone_number'
        }, {
          header: 'ارسال ایمیل',
          sortField: 'state'
        }, {
          header: 'وضعیت',
          sortField: 'active'
        }, {
          header: 'عملیات',
        }],
        onAdd: this.addUser,
        onFetch: (data: SearchParam) => this.userService.getUsers(data).toPromise()
      };
    } catch {
    }
  }

  async changeUserStatus(user: User, activate: boolean) {
    const result = await this.userService.activateUser(user.id, activate).toPromise();
    if (result.status == 'OK') {
      user.active = activate;
    }
  }

  async deleteUser(user: User) {
    this.relations = await this.userService.getRelations(user.id).toPromise();
    if (this.relations.rooms.length || this.relations.groups.length) {
      this.dialogService.open(UserRelationsComponent, {
        data: this.relations,
        header: 'تاییدیه حذف کاربر',
        rtl: this.fa
      }).onClose.subscribe(async res => {
        if (res) {
          await this.deleteUserFromList(user);
        }
      });
    } else {
      const dialogRes = await this.utilsService.showConfirm({
        header: 'تاییدیه حذف کاربر',
        message: 'ایا از حذف کاربر مطمئن هستید؟',
        rtl: this.fa
      });
      if (dialogRes) {
        await this.deleteUserFromList(user);
      }
    }
  }

  addUser = async () => {
    const dialogRef = this.utilsService.showDialogForm('افزودن کاربر',
      [
        {
          type: 'text',
          formControlName: 'first_name',
          label: 'نام',
          className: 'col-md-6',
          errors: [{type: 'required', message: 'این فیلد الزامیست'}]
        },
        {
          type: 'text',
          formControlName: 'last_name',
          label: 'نام خانوادگی',
          className: 'col-md-6',
          errors: [{type: 'required', message: 'این فیلد الزامیست'}]
        },
        {
          type: 'text',
          formControlName: 'email',
          label: 'ایمیل',
          className: 'col-md-6',
          errors: [{type: 'required', message: 'این فیلد الزامیست'}, {type: 'email', message: 'ایمیل نامعتبر است'}]
        },
        {
          type: 'text',
          formControlName: 'phone_number',
          label: 'شماره موبایل',
          className: 'col-md-6',
          maxlength: 11,
          keyFilter: 'num',
          errors: [{type: 'required', message: 'این فیلد الزامیست'}]
        },
      ], {width: '900px', rtl: this.fa}
    );
    dialogRef.onClose.subscribe(async (res: any) => {
      if (res) {
        const result = await this.userService.addUser(res).toPromise();
        if (result.status == 'OK') {
          this.rowData.items.unshift(result.data.user);
        }
      }
    });
  };

  editUser(user: User, index: number) {
    const dialogRef = this.utilsService.showDialogForm('ویرایش کاربر',
      [
        {
          type: 'hidden',
          formControlName: 'user_id',
          value: user.id
        },
        {
          type: 'text',
          formControlName: 'first_name',
          label: 'نام',
          className: 'col-md-6',
          errors: [{type: 'required', message: 'این فیلد الزامیست'}],
          value: user.first_name
        },
        {
          type: 'text',
          formControlName: 'last_name',
          label: 'نام خانوادگی',
          className: 'col-md-6',
          errors: [{type: 'required', message: 'این فیلد الزامیست'}],
          value: user.last_name
        },
        {
          type: 'text',
          formControlName: 'email',
          label: 'ایمیل',
          className: 'col-md-6',
          errors: [{type: 'required', message: 'این فیلد الزامیست'}, {type: 'email', message: 'ایمیل نامعتبر است'}],
          value: user.email
        },
        {
          type: 'text',
          formControlName: 'phone_number',
          label: 'شماره موبایل',
          className: 'col-md-6',
          maxlength: 11,
          keyFilter: 'num',
          errors: [{type: 'required', message: 'این فیلد الزامیست'}],
          value: user.phone_number
        },
      ], {width: '900px', rtl: this.fa}
    );
    dialogRef.onClose.subscribe(async (res: any) => {
      if (res) {
        const result = await this.userService.updateUser(res).toPromise();
        if (result.status == 'OK') {
          this.rowData.items[index] = result.data.user;
        }
      }
    });
  }

  async deleteUserFromList(user: User) {
    const result = await this.userService.deleteUser(user.id).toPromise();
    if (result.status == 'OK') {
      const index = this.rowData.items.findIndex(it => it.id === user.id);
      this.rowData.items.splice(index, 1);
    }
  }

  async resetPassword(user: User) {
    try {
      const dialogRes = await this.utilsService.showConfirm({
        header: 'تاییدیه بازیابی رمز عبور',
        message: 'بازیابی رمزعبور و ارسال ایمیل مطمئن هستید؟',
        rtl: this.fa
      });
      if (dialogRes) {
        const password = await this.userService.resetPassword(user.email).toPromise();
        await this.utilsService.showDialogForm('رمزعبور جدید', [
          {
            type: 'text',
            formControlName: 'email',
            value: user.email,
            readonly: true,
            disabled: true
          },
          {
            type: 'password',
            formControlName: 'pass',
            value: password,
            readonly: true,
            showPassword: true,
            disabled: true
          }
        ], {
          rejectVisible: false,
          acceptLabel: 'تایید',
          acceptIcon: null,
          rtl: this.fa
        });
      }
    } catch {
    }
  }
}
