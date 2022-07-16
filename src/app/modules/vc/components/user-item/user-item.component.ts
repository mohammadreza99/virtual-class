import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {RoomUser} from '@core/models';
import {RoomService, SessionService} from '@core/http';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {OverlayPanel} from 'primeng/overlaypanel';
import {UtilsService} from '@ng/services';
import {UpdateViewService} from '@core/utils';
import {DialogService} from 'primeng/dynamicdialog';
import {KickUserConfirmComponent} from '@modules/vc/components/kick-user-confirm/kick-user-confirm.component';
import {UploadAvatarComponent} from '@shared/components/upload-avatar/upload-avatar.component';
import {takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {GlobalConfig} from '@core/global.config';

@Component({
  selector: 'ng-user-item',
  templateUrl: './user-item.component.html',
  styleUrls: ['./user-item.component.scss']
})
export class UserItemComponent extends LanguageChecker implements OnInit, OnDestroy {

  constructor(private sessionService: SessionService,
              private roomService: RoomService,
              private utilsService: UtilsService,
              private dialogService: DialogService,
              private updateViewService: UpdateViewService) {
    super();
  }

  @Input() enableActions: boolean = true;
  @Input() user: RoomUser;
  @Input() raiseHand: boolean;

  destroy$: Subject<boolean> = new Subject<boolean>();
  activateRaiseHand: boolean = false;
  raiseHandConfirmed: boolean = false;
  currentUser: RoomUser;
  isTalkingUpdateTimer: any;
  isTalking: boolean = false;
  loading: boolean = false;

  ngOnInit(): void {
    this.currentUser = this.sessionService.currentUser;
    this.updateViewService.getViewEvent().pipe(takeUntil(this.destroy$)).subscribe(res => {
      switch (res.event) {
        case 'studentRaisedHand':
          if (res.data.target == this.user.id) {
            this.activateRaiseHand = res.data.value;
          }
          break;

        case 'teacherConfirmRaisedHand':
          if (res.data.target == this.user.id) {
            this.raiseHandConfirmed = res.data.value;
          }
          break;

        case 'isTalking':
          if (res.data.target != this.user.id) {
            return;
          }
          if (res.data.value) {
            this.isTalking = true;
            if (this.isTalkingUpdateTimer) {
              clearTimeout(this.isTalkingUpdateTimer);
            }
            this.isTalkingUpdateTimer = setTimeout(() => {
              this.isTalking = false;
            }, GlobalConfig.isTalkingDisplayTime);
          }
          break;
      }
    });
  }

  async muteUser(callback: (toggleState?: boolean) => any) {
    const oldState = this.user.muted;
    try {
      this.user.muted = !this.user.muted;
      await this.sessionService.muteUser(this.user.id, this.user.muted).toPromise();
      callback();
    } catch (error) {
      console.error(error);
      this.user.muted = oldState;
      callback();
    }
  }

  async muteUserCamera(callback: (toggleState?: boolean) => any) {
    const oldState = this.user.muted_video;
    try {
      this.user.muted_video = !this.user.muted_video;
      await this.sessionService.muteUserVideo(this.user.id, this.user.muted_video).toPromise();
      callback();
    } catch (error) {
      console.error(error);
      this.user.muted_video = oldState;
      callback();
    }
  }

  async confirmRaiseHand(callback: any) {
    try {
      await this.sessionService.acceptRaiseHand(this.user.id).toPromise();
      await this.sessionService.muteUser(this.user.id, false).toPromise();
      this.raiseHandConfirmed = true;
      callback();
    } catch (error) {
      console.error(error);
      callback();
    }
  }

  async rejectRaiseHand(callback: any, mute: boolean) {
    try {
      await this.sessionService.rejectRaiseHand(this.user.id).toPromise();
      if (mute) {
        await this.sessionService.muteUser(this.user.id, true).toPromise();
      }
      this.raiseHandConfirmed = false;
      callback();
    } catch (error) {
      console.error(error);
      callback();
    }
  }

  async kickUser(actionsOverlay: OverlayPanel) {
    try {
      this.dialogService.open(KickUserConfirmComponent, {
        data: this.user,
        header: this.instant('room.kickUser'),
        width: '400px',
        rtl: this.fa,
        closable: false
      }).onClose.pipe(takeUntil(this.destroy$)).subscribe(async res => {
        if (res !== false) {
          if (this.user.role == 'Admin') {
            return;
          }
          await this.sessionService.kickUser(this.user.id, res).toPromise();
        }
      });
      actionsOverlay.hide();
    } catch (error) {
      console.error(error);
    }
  }

  // async assignAdmin(actionsOverlay: OverlayPanel) {
  //   try {
  //     const upgradeMessage = this.translationService.instant('room.upgradeRoleConfirm', {value: this.user.last_name}) as string;
  //     const dialogRes = await this.utilsService.showConfirm({message: upgradeMessage, rtl: this.fa});
  //     if (dialogRes) {
  //       await this.roomService.assignRole(this.user.id, 'Admin').toPromise();
  //       this.user.role = 'Admin';
  //     }
  //   } catch (error) {
  //     console.error(error);
  //   }
  // }

  // async unAssignAdmin() {
  //   try {
  //     const downgradeMessage = this.translationService.instant('room.downgradeRoleConfirm', {value: this.user.last_name}) as string;
  //     const dialogRes = await this.utilsService.showConfirm({message: downgradeMessage, rtl: this.fa});
  //     if (dialogRes) {
  //       await this.roomService.assignRole(this.user.id, 'Viewer').toPromise();
  //       this.user.role = 'Viewer';
  //     }
  //   } catch (error) {
  //     console.error(error);
  //   }
  // }

  showStatus(event, actions: OverlayPanel, userStatus: OverlayPanel, actionsButton: any) {
    actions.hide();
    setTimeout(() => {
      userStatus.toggle(event, actionsButton);
    }, 150);
  }

  async restoreKickedUser(callback: any) {
    try {
      const res = await this.sessionService.restoreKickedUser(this.user.id).toPromise();
      if (res.status == 'OK') {
        this.user.kicked = false;
      }
      callback();
    } catch (err) {
      callback();
    }
  }

  async changeAvatar() {
    try {
      this.dialogService.open(UploadAvatarComponent, {
        data: this.user,
        header: this.instant('changeAvatar'),
        width: '400px',
        rtl: this.fa
      }).onClose.pipe(takeUntil(this.destroy$)).subscribe(async res => {
        if (!res) {
          return;
        }
        if (res == 'delete') {
          await this.sessionService.deleteUserAvatar(this.user.id).toPromise();
          this.user.avatar = null;
          this.updateViewService.setViewEvent({event: 'updateAvatar', data: this.user});
          return;
        }
        const result = await this.sessionService.getUserUploadLink(this.user.id).toPromise();
        if (result.status == 'OK') {
          this.loading = true;
          await this.sessionService.uploadUserAvatar(result.data.upload_url, res.file).toPromise();
          this.loading = false;
          this.user.avatar = res.base64;
          this.updateViewService.setViewEvent({event: 'updateAvatar', data: this.user});
        }
      });
    } catch (error) {
      console.error(error);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
