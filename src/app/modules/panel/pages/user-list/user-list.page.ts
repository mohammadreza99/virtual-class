import {Component, OnInit} from '@angular/core';
import {UserService} from '@core/http';
import {UtilsService} from '@ng/services';
import {DialogService} from 'primeng/dynamicdialog';
import {PagerRes, SearchParam, TableConfig, User, UserRelation} from '@core/models';
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
          header: this.translations.name,
          sortField: 'first_name'
        }, {
          header: this.translations.lastName,
          sortField: 'last_name'
        }, {
          header: this.translations.email,
          sortField: 'email'
        }, {
          header: this.translations.mobile,
          sortField: 'phone_number'
        }, {
          header: this.translations.sendEmail,
          sortField: 'state'
        }, {
          header: this.translations.status,
          sortField: 'active'
        }, {
          header: this.translations.operations,
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
        header: this.translations.deleteUserConfirm,
        rtl: this.fa
      }).onClose.subscribe(async res => {
        if (res) {
          await this.deleteUserFromList(user);
        }
      });
    } else {
      const dialogRes = await this.utilsService.showConfirm({
        header: this.translations.deleteUserConfirm,
        message: this.translations.deleteUserConfirmBody,
        rtl: this.fa
      });
      if (dialogRes) {
        await this.deleteUserFromList(user);
      }
    }
  }

  addUser = async () => {
    const dialogRef = this.utilsService.showDialogForm(this.translations.addUser,
      [
        {
          type: 'text',
          formControlName: 'first_name',
          label: this.translations.name,
          className: 'col-md-6',
          errors: [{type: 'required', message: this.translations.requiredField}]
        },
        {
          type: 'text',
          formControlName: 'last_name',
          label: this.translations.lastName,
          className: 'col-md-6',
          errors: [{type: 'required', message: this.translations.requiredField}]
        },
        {
          type: 'text',
          formControlName: 'email',
          label: this.translations.email,
          className: 'col-md-6',
          errors: [{type: 'required', message: this.translations.requiredField}, {
            type: 'email',
            message: this.translations.emailPattern
          }]
        },
        {
          type: 'text',
          formControlName: 'phone_number',
          label: this.translations.mobile,
          className: 'col-md-6',
          maxlength: 11,
          keyFilter: 'num',
          errors: [{type: 'required', message: this.translations.requiredField}]
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
    const dialogRef = this.utilsService.showDialogForm(this.translations.editUser,
      [
        {
          type: 'hidden',
          formControlName: 'user_id',
          value: user.id
        },
        {
          type: 'text',
          formControlName: 'first_name',
          label: this.translations.name,
          className: 'col-md-6',
          errors: [{type: 'required', message: this.translations.requiredField}],
          value: user.first_name
        },
        {
          type: 'text',
          formControlName: 'last_name',
          label: this.translations.lastName,
          className: 'col-md-6',
          errors: [{type: 'required', message: this.translations.requiredField}],
          value: user.last_name
        },
        {
          type: 'text',
          formControlName: 'email',
          label: this.translations.email,
          className: 'col-md-6',
          errors: [{type: 'required', message: this.translations.requiredField}, {
            type: 'email',
            message: this.translations.emailPattern
          }],
          value: user.email
        },
        {
          type: 'text',
          formControlName: 'phone_number',
          label: this.translations.mobile,
          className: 'col-md-6',
          maxlength: 11,
          keyFilter: 'num',
          errors: [{type: 'required', message: this.translations.requiredField}],
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
        header: this.translations.passwordResetConfirmTitle,
        message: this.translations.passwordResetConfirmBody,
        rtl: this.fa
      });
      if (dialogRes) {
        const password = await this.userService.resetPassword(user.email).toPromise();
        await this.utilsService.showDialogForm(this.translations.newPassword, [
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
          acceptLabel: this.translations.verify,
          acceptIcon: null,
          rtl: this.fa
        });
      }
    } catch {
    }
  }

  getTranslated(state: string) {
    const str = state.charAt(0).toLowerCase() + state.slice(1);
    return this.translations[str];
  }
}
