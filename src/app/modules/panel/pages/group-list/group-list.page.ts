import {Component, OnDestroy, OnInit} from '@angular/core';
import {GroupService, UserService} from '@core/http';
import {UtilsService} from '@ng/services';
import {Group, GroupRelation, PagerRes, SearchParam, TableConfig} from '@core/models';
import {NgDropdownItem} from '@ng/models/forms';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {AddGroupFormComponent} from '@modules/panel/components/add-group-form/add-group-form.component';
import {DialogService} from 'primeng/dynamicdialog';
import {GroupRelationsComponent} from '@modules/panel/components/group-relations/group-relations.component';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'ng-group-list',
  templateUrl: './group-list.page.html',
  styleUrls: ['./group-list.page.scss']
})
export class GroupListPage extends LanguageChecker implements OnInit, OnDestroy {
  constructor(private groupService: GroupService,
              private userService: UserService,
              private utilsService: UtilsService,
              private dialogService: DialogService) {
    super();
  }

  destroy$: Subject<boolean> = new Subject<boolean>();
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
          header: this.instant('name'),
          sortField: 'name'
        }, {
          header: this.instant('membersCount'),
          sortField: 'user_count'
        }, {
          header: this.instant('joinedInClassOrGroup'),
          sortField: 'room_count'
        }, {
          header: this.instant('status'),
          sortField: 'active'
        }, {
          header: this.instant('operations'),
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
    const dialogRef = this.utilsService.showDialogForm(this.instant('editGroup'),
      [
        {
          type: 'hidden',
          formControlName: 'group_id',
          value: group.id
        },
        {
          type: 'text',
          formControlName: 'name',
          label: this.instant('name'),
          className: 'col-12',
          errors: [{type: 'required', message: this.instant('requiredField')}],
          value: group.name
        },
      ], {width: '900px', rtl: this.fa}
    );
    dialogRef.onClose.pipe(takeUntil(this.destroy$)).subscribe(async (res: any) => {
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
        this.dialogService.open(GroupRelationsComponent, {
          data: this.relations,
          header: this.instant('deleteGroupConfirm'),
          width: '900px',
          rtl: this.fa
        }).onClose.pipe(takeUntil(this.destroy$)).subscribe(async res => {
          if (res) {
            await this.deleteGroupFromList(group);
          }
        });
      } else {
        const dialogRes = await this.utilsService.showConfirm({
          header: this.instant('deleteGroupConfirm'),
          message: this.instant('deleteGroupConfirmBody'),
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
      header: this.instant('addGroup'),
      width: '900px',
      rtl: this.fa
    }).onClose.pipe(takeUntil(this.destroy$)).subscribe(async res => {
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

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

}
