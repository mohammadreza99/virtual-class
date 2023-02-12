import {Component, OnInit} from '@angular/core';
import {DynamicDialogConfig, DynamicDialogRef} from 'primeng/dynamicdialog';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';

@Component({
  selector: 'ng-whiteboard-manage-permission',
  templateUrl: './whiteboard-manage-permission.component.html',
  styleUrls: ['./whiteboard-manage-permission.component.scss']
})
export class WhiteboardManagePermissionComponent extends LanguageChecker implements OnInit {

  constructor(private dialogRef: DynamicDialogRef,
              private dialogConfig: DynamicDialogConfig) {
    super();
  }

  filteredUsers: any[] = [];
  selectedUsers: any[] = [];
  unselectedUsers: any[] = [];
  allowedUsers: any[] = [];

  ngOnInit(): void {
    this.allowedUsers = this.dialogConfig.data.allowedUsers;
  }

  async onSearchUsers(event: any) {
    const users = this.dialogConfig.data.users;
    const data = users.filter(u => u.first_name.toLowerCase().includes(event.query.toLowerCase()) || u.last_name.toLowerCase().includes(event.query.toLowerCase()));
    if (!data.length) {
      this.filteredUsers = [];
      return;
    }
    this.filteredUsers = data.map(item => ({
      id: item.id,
      label: `${item.first_name} ${item.last_name}`,
      ...item
    }));
  }

  onSelectUser(selectedUser: any) {
    if (this.selectedUsers.findIndex(u => u.id === selectedUser.id) > -1) {
      return;
    }
    const unselectedIdx = this.unselectedUsers.findIndex(u => u.id === selectedUser.id);
    if (unselectedIdx >= 0) {
      this.unselectedUsers.splice(unselectedIdx, 1);
    }
    this.selectedUsers.push(selectedUser);
  }

  onUnselectUser(event: any) {
    const idx = this.selectedUsers.findIndex(u => u.id == event.id);
    this.selectedUsers.splice(idx, 1);
    this.unselectedUsers.push(event);
  }

  onSubmit() {
    this.dialogRef.close({
      selectedUsers: this.selectedUsers.map(u => u.id),
      unselectedUsers: this.unselectedUsers.map(u => u.id),
    });
  }
}
