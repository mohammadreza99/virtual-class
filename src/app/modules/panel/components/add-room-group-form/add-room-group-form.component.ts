import {Component, OnInit} from '@angular/core';
import {GroupService} from '@core/http';
import {DynamicDialogConfig, DynamicDialogRef} from 'primeng/dynamicdialog';
import {UtilsService} from '@ng/services';
import {TableConfig, User} from '@core/models';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';

@Component({
  selector: 'ng-add-room-group-form',
  templateUrl: './add-room-group-form.component.html',
  styleUrls: ['./add-room-group-form.component.scss']
})
export class AddRoomGroupFormComponent extends LanguageChecker implements OnInit {

  constructor(private groupService: GroupService,
              private dialogConfig: DynamicDialogConfig,
              private dialogRef: DynamicDialogRef,
              private utilsService: UtilsService) {
    super();
  }

  filteredGroups: any[];
  selectedGroups: User[] = [];
  selectedRole: string = 'Admin';
  config: TableConfig = {
    colDef: [
      {header: this.translations.name},
      {header: this.translations.membersCount},
      {header: this.translations.access},
      {header: this.translations.operations},
    ]
  };

  ngOnInit(): void {
  }

  async onSearchGroups(event: any) {
    const data = await this.groupService.getGroups({search: event.query}).toPromise();
    this.filteredGroups = data.items.map(item => ({
      id: item.id,
      label: item.name,
      ...item
    }));
  }

  onSelectGroup(selectedGroup: any) {
    if (this.selectedGroups.findIndex(u => u.id === selectedGroup.id) > -1) {
      return;
    }
    this.selectedGroups.push({...selectedGroup, role: this.selectedRole});
  }

  async removeGroup(item: User) {
    const dialogRes = await this.utilsService.showConfirm({
      rtl: this.fa,
      header: this.translations.deleteGroupConfirm,
      message: this.translations.deleteGroupConfirmBody
    });
    if (dialogRes) {
      const idx = this.selectedGroups.findIndex(u => u.id == item.id);
      this.selectedGroups.splice(idx, 1);
    }
  }

  onSubmit() {
    const result = this.selectedGroups.map(u => ({
      type: 'Group',
      role: this.selectedRole,
      model_id: u.id
    }));
    this.dialogRef.close(result);
  }
}
