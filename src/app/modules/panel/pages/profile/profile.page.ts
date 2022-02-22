import {Component, OnDestroy, OnInit} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, ValidationErrors} from '@angular/forms';
import {User} from '@core/models';
import {AuthService, SessionService} from '@core/http';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {UtilsService} from '@ng/services';
import {DialogService} from 'primeng/dynamicdialog';
import {takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';

@Component({
  selector: 'ng-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss']
})
export class ProfilePage extends LanguageChecker implements OnInit, OnDestroy {

  constructor(private authService: AuthService,
              private sessionService: SessionService,
              private dialogService: DialogService,
              private utilsService: UtilsService) {
    super();
  }

  destroy$: Subject<boolean> = new Subject<boolean>();
  form = new FormGroup({
    last_name: new FormControl(),
    first_name: new FormControl(),
    nick_name: new FormControl(),
    email: new FormControl(),
  });

  currentUser: User;

  ngOnInit(): void {
    this.loadData();
  }

  async loadData() {
    this.currentUser = this.authService.currentUser;
    this.form.setValue({
      last_name: this.currentUser.last_name,
      first_name: this.currentUser.first_name,
      email: this.currentUser.email,
      nick_name: this.currentUser.nick_name || `${this.currentUser.first_name} ${this.currentUser.last_name}`,
    });
  }

  async updateProfile() {
    try {
      const dialogRef = this.utilsService.showDialogForm(this.translations.editProfile,
        [
          {
            type: 'text',
            formControlName: 'first_name',
            label: this.translations.name,
            className: 'col-md-6',
            errors: [{type: 'required', message: this.translations.requiredField}],
            value: this.currentUser.first_name
          },
          {
            type: 'text',
            formControlName: 'last_name',
            label: this.translations.lastName,
            className: 'col-md-6',
            errors: [{type: 'required', message: this.translations.requiredField}],
            value: this.currentUser.last_name
          },
          {
            type: 'text',
            formControlName: 'nick_name',
            label: this.translations.nickName,
            className: 'col-md-6',
            errors: [{type: 'required', message: this.translations.requiredField}],
            value: this.currentUser.nick_name
          },
          {
            type: 'text',
            formControlName: 'email',
            label: this.translations.email,
            className: 'col-md-6',
            errors: [{type: 'required', message: this.translations.requiredField}, {
              type: 'email',
              message: this.translations.emailPattern
            }],
            value: this.currentUser.email
          },
        ], {width: '900px', rtl: this.fa}
      );
      dialogRef.onClose.pipe(takeUntil(this.destroy$)).subscribe(async (res: any) => {
        if (res) {
          const result = await this.authService.updateProfile(res).toPromise();
          if (result.status == 'OK') {
            this.form.patchValue(result.data.user);
          }
        }
      });
    } catch {
    }
  }

  checkPasswords(group: AbstractControl): ValidationErrors | null {
    const pass = group.get('new_password').value;
    const confirmPass = group.get('confirm_password').value;
    return pass === confirmPass ? null : {notSame: true};
  }

  updatePassword() {
    const dialogRef = this.utilsService.showDialogForm(this.translations.changePassword,
      [
        {
          type: 'password',
          formControlName: 'current_password',
          label: this.translations.currentPassword,
          className: 'col-12',
          errors: [{type: 'required', message: this.translations.requiredField}]
        },
        {
          type: 'password',
          formControlName: 'new_password',
          label: this.translations.newPassword,
          className: 'col-12',
          errors: [{type: 'required', message: this.translations.requiredField}]
        },
        {
          type: 'password',
          formControlName: 'confirm_password',
          label: this.translations.repeatNewPassword,
          className: 'col-12',
          errors: [{type: 'required', message: this.translations.requiredField}]
        },
      ], {
        width: '600px',
        rtl: this.fa,
        formValidator: {
          validatorFn: this.checkPasswords,
          error: 'notSame',
          message: this.translations.passwordNotMatch
        }
      });
    dialogRef.onClose.pipe(takeUntil(this.destroy$)).subscribe(async (res: any) => {
      if (res) {
        await this.authService.updatePassword(res).toPromise();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

}
