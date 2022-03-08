import {Component, OnDestroy, OnInit} from '@angular/core';
import {GroupService} from '@core/http';
import {ActivatedRoute} from '@angular/router';
import {DialogService} from 'primeng/dynamicdialog';
import {UtilsService} from '@ng/services';
import {PagerRes, TableConfig, User} from '@core/models';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {AddGroupUserFormComponent} from '@modules/panel/components/add-group-user-form/add-group-user-form.component';
import {takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';

@Component({
  selector: 'ng-group-setting',
  templateUrl: './group-setting.page.html',
  styleUrls: ['./group-setting.page.scss']
})
export class GroupSettingPage extends LanguageChecker implements OnInit, OnDestroy {

  constructor(private groupService: GroupService,
              private route: ActivatedRoute,
              private dialogService: DialogService,
              private utilsService: UtilsService) {
    super();
  }

  groupUsers: PagerRes<User>;
  groupUsersConfig: TableConfig;
  groupId: number;
  destroy$: Subject<boolean> = new Subject<boolean>();

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
          {header: this.instant('fullName')},
          {header: this.instant('email')},
          {header: this.instant('access')},
          {header: this.instant('operations')},
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
      header: this.instant('addMember'),
      width: '900px',
      rtl: this.fa
    }).onClose.pipe(takeUntil(this.destroy$)).subscribe(async res => {
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
        header: this.instant('deleteUserConfirm'),
        message: this.instant('deleteUserConfirmBody'),
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

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
