import {Component, Input, OnInit} from '@angular/core';
import {UploadAvatarComponent} from '@shared/components/upload-avatar/upload-avatar.component';
import {AuthService, SessionService} from '@core/http';
import {DialogService} from 'primeng/dynamicdialog';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {UpdateViewService} from '@core/utils';

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
  @Input() loading: boolean = false;

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
        header: this.instant('changeAvatar'),
        width: '400px',
        rtl: this.fa,
      }).onClose.subscribe(async res => {
        if (!res) {
          return;
        }
        if (res == 'delete') {
          await this.authService.deleteAvatar().toPromise();
          this.user.avatar = null;
          this.updateViewService.setViewEvent({event: 'updateAvatar', data: this.user});
          return;
        }
        const result = await this.authService.getUploadLink().toPromise();
        if (result.status == 'OK') {
          this.loading = true;
          await this.authService.uploadAvatar(result.data.upload_url, res.file).toPromise();
          this.user.avatar = res.base64;
          this.updateViewService.setViewEvent({event: 'updateAvatar', data: this.user});
          this.loading = false;
        }
      });
    } catch (error) {
      console.error(error);
      this.loading = false;
    }
  }
}
