import {Component, OnInit} from '@angular/core';
import {TableConfig, User} from '@core/models';
import {UserService} from '@core/http';
import {DynamicDialogConfig, DynamicDialogRef} from 'primeng/dynamicdialog';
import {UtilsService} from '@ng/services';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';

@Component({
  selector: 'ng-add-group-user-form',
  templateUrl: './add-group-user-form.component.html',
  styleUrls: ['./add-group-user-form.component.scss']
})
export class AddGroupUserFormComponent extends LanguageChecker implements OnInit {

  constructor(private userService: UserService,
              private dialogConfig: DynamicDialogConfig,
              private dialogRef: DynamicDialogRef,
              private utilsService: UtilsService) {
    super();
  }

  filteredUsers: any[];
  selectedUsers: User[] = [];
  config: TableConfig = {
    colDef: [
      {header: 'نام و نام خانوادگی'},
      {header: 'ایمیل'},
      {header: 'دسترسی'},
      {header: 'عملیات'},
    ]
  };

  ngOnInit(): void {
  }

  async onSearchUsers(event: any) {
    const data = await this.userService.getUsers({search: event.query}).toPromise();
    this.filteredUsers = data.items.map(item => ({
      id: item.id,
      label: `${item.first_name} ${item.last_name}`,
      ...item
    }));
  }

  onSelectUser(selectedUser: any) {
    if (this.selectedUsers.findIndex(u => u.id === selectedUser.id) > -1) {
      return;
    }
    this.selectedUsers.push(selectedUser);
  }

  async removeUser(item: User) {
    const dialogRes = await this.utilsService.showConfirm({
      rtl: this.fa,
      header: 'تاییدیه حذف کاربر',
      message: 'آیا مایلید کاربر حذف شود؟'
    });
    if (dialogRes) {
      const idx = this.selectedUsers.findIndex(u => u.id == item.id);
      this.selectedUsers.splice(idx, 1);
    }
  }

  onSubmit() {
    this.dialogRef.close(this.selectedUsers.map(u => u.id));
  }
}
