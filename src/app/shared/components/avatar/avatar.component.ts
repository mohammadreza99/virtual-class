import {Component, Input, OnInit} from '@angular/core';
import {UploadAvatarComponent} from '@shared/components/upload-avatar/upload-avatar.component';
import {AuthService, SessionService} from '@core/http';
import {DialogService} from 'primeng/dynamicdialog';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {UpdateViewService} from '@core/http/update-view.service';

@Component({
  selector: 'ng-avatar',
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.scss']
})
export class AvatarComponent extends LanguageChecker implements OnInit {

  constructor(private sessionService: SessionService,
              private dialogService: DialogService,
              private updateViewService: UpdateViewService,
              private authService: AuthService) {
    super();
  }

  @Input() user: any;
  @Input() editable: boolean = false;
  @Input() colorFull: boolean = true;
  @Input() size: string = 'large';

  ngOnInit(): void {
    if (!this.user) {
      this.user = this.sessionService.currentUser;
    }

    this.updateViewService.getViewEvent().subscribe(res => {
      switch (res.event) {
        case 'updateAvatar':
          if (this.user.id == res.data.id) {
            this.user.avatar = res.data.avatar;
          }
          break;
      }
    });
  }

  getColor() {
    return this.sessionService.getProfileColor(this.user.id || this.user.user_id);
  }

  async changeAvatar() {
    if (!this.editable) {
      return;
    }
    try {
      this.dialogService.open(UploadAvatarComponent, {
        data: this.user,
        header: this.translations.room.changeAvatar,
        width: '400px',
        rtl: this.fa
      }).onClose.subscribe(async res => {
        if (res) {
          const result = await this.authService.getUploadLink().toPromise();
          if (result.status == 'OK') {
            await this.authService.uploadAvatar(result.data.upload_url, res).toPromise();
            const data = await this.authService.getSelfUser().toPromise();
            this.user = data.data.user;
            this.updateViewService.setViewEvent({event: 'updateAvatar', data: this.user});
          }
        }
      });
    } catch (error) {
      console.error(error);
    }
  }

}
