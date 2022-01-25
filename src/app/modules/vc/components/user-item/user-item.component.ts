import {Component, Input, OnInit} from '@angular/core';
import {RoomUser} from '@core/models';
import {SessionService} from '@core/http';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {OverlayPanel} from 'primeng/overlaypanel';
import {UtilsService} from '@ng/services';
import {UpdateViewService} from '@core/http/update-view.service';

@Component({
  selector: 'ng-user-item',
  templateUrl: './user-item.component.html',
  styleUrls: ['./user-item.component.scss']
})
export class UserItemComponent extends LanguageChecker implements OnInit {

  constructor(private sessionService: SessionService, private utilsService: UtilsService, private updateViewService: UpdateViewService) {
    super();
  }

  @Input() user: RoomUser;
  @Input() raiseHand: boolean;
  activateRaiseHand: boolean = false;
  raiseHandConfirmed: boolean = false;
  currentUser: RoomUser;

  ngOnInit(): void {
    this.currentUser = this.sessionService.currentUser;
    this.updateViewService.getViewEvent().subscribe(res => {
      switch (res.event) {
        case 'raiseHand':
          if (res.data.target == this.user.id) {
            this.activateRaiseHand = res.data.value;
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

  async confirmRaiseHand() {
    try {
      await this.sessionService.acceptRaiseHand(this.user.id).toPromise();
      await this.sessionService.muteUser(this.user.id, false).toPromise();
      this.raiseHandConfirmed = true;
    } catch (error) {
      console.error(error);
    }
  }

  async rejectRaiseHand(mute: boolean) {
    await this.sessionService.rejectRaiseHand(this.user.id).toPromise();
    if (mute) {
      await this.sessionService.muteUser(this.user.id, true).toPromise();
    }
    this.raiseHandConfirmed = false;
  }

  async assignAdmin() {
    try {
      const upgradeMessage = this.translationService.instant('room.upgradeRoleConfirm', {value: this.user.last_name}) as string;
      const dialogRes = await this.utilsService.showConfirm({message: upgradeMessage, rtl: this.fa});
      if (dialogRes) {
        await this.sessionService.assignRole(this.user.id, 'Admin').toPromise();
        this.user.role = 'Admin';
      }
    } catch (error) {
      console.error(error);
    }
  }

  async unAssignAdmin() {
    try {
      const downgradeMessage = this.translationService.instant('room.downgradeRoleConfirm', {value: this.user.last_name}) as string;
      const dialogRes = await this.utilsService.showConfirm({message: downgradeMessage, rtl: this.fa});
      if (dialogRes) {
        await this.sessionService.assignRole(this.user.id, 'Viewer').toPromise();
        this.user.role = 'Viewer';
      }
    } catch (error) {
      console.error(error);
    }
  }

  async kickUser() {
    try {
      const fireMessage = this.translationService.instant('room.fireUserConfirm', {value: this.user.last_name}) as string;
      const dialogRes = await this.utilsService.showConfirm({message: fireMessage, rtl: this.fa});
      if (dialogRes) {
        if (this.user.role == 'Admin') {
          return;
        }
        await this.sessionService.kickUser(this.user.id).toPromise();
      }
    } catch (error) {
      console.error(error);
    }
  }

  async actionClick(action: string, actions: OverlayPanel) {
    switch (action) {
      case 'assign-admin':
        await this.assignAdmin();
        break;

      case 'unassign-admin':
        await this.unAssignAdmin();
        break;

      case 'remove-user':
        await this.kickUser();
        break;
    }
  }

  getColor() {
    return this.sessionService.getProfileColor(this.user.id);
  }

}
