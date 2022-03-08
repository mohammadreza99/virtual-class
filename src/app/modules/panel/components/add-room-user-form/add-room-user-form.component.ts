import {Component, OnInit} from '@angular/core';
import {TableConfig, User} from '@core/models';
import {UserService} from '@core/http';
import {DynamicDialogConfig, DynamicDialogRef} from 'primeng/dynamicdialog';
import {UtilsService} from '@ng/services';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';

@Component({
  selector: 'ng-add-room-user-form',
  templateUrl: './add-room-user-form.component.html',
  styleUrls: ['./add-room-user-form.component.scss']
})
export class AddRoomUserFormComponent extends LanguageChecker implements OnInit {

  constructor(private userService: UserService,
              public dialogConfig: DynamicDialogConfig,
              private dialogRef: DynamicDialogRef,
              private utilsService: UtilsService) {
    super();
  }

  filteredUsers: any[];
  selectedUsers: User[] = [];
  selectedRole: string = 'Admin';
  config: TableConfig = {
    colDef: [
      {header: this.instant('fullName')},
      {header: this.instant('email')},
      {header: this.instant('access')},
      {header: this.instant('operations')},
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
    this.selectedUsers.push({...selectedUser});
  }

  async removeUser(item: User) {
    const dialogRes = await this.utilsService.showConfirm({
      rtl: this.fa,
      header: this.instant('deleteUserConfirm'),
      message: this.instant('deleteUserConfirmBody')
    });
    if (dialogRes) {
      const idx = this.selectedUsers.findIndex(u => u.id == item.id);
      this.selectedUsers.splice(idx, 1);
    }
  }

  onSubmit() {
    const result = this.selectedUsers.map(u => ({
      type: 'User',
      role: this.selectedRole,
      model_id: u.id
    }));
    this.dialogRef.close(result);
  }
}
