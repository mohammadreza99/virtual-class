import {Component, OnInit} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, ValidationErrors} from '@angular/forms';
import {User} from '@core/models';
import {AuthService, SessionService} from '@core/http';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {UtilsService} from '@ng/services';

@Component({
  selector: 'ng-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss']
})
export class ProfilePage extends LanguageChecker implements OnInit {

  constructor(private authService: AuthService, private sessionService: SessionService, private utilsService: UtilsService) {
    super();
  }

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
      const dialogRef = this.utilsService.showDialogForm('ویرایش حساب کاربری',
        [
          {
            type: 'text',
            formControlName: 'first_name',
            label: 'نام',
            className: 'col-md-6',
            errors: [{type: 'required', message: 'این فیلد الزامیست'}],
            value: this.currentUser.first_name
          },
          {
            type: 'text',
            formControlName: 'last_name',
            label: 'نام خانوادگی',
            className: 'col-md-6',
            errors: [{type: 'required', message: 'این فیلد الزامیست'}],
            value: this.currentUser.last_name
          },
          {
            type: 'text',
            formControlName: 'nick_name',
            label: 'نام نمایشی',
            className: 'col-md-6',
            errors: [{type: 'required', message: 'این فیلد الزامیست'}],
            value: this.currentUser.nick_name
          },
          {
            type: 'text',
            formControlName: 'email',
            label: 'ایمیل',
            className: 'col-md-6',
            errors: [{type: 'required', message: 'این فیلد الزامیست'}, {type: 'email', message: 'ایمیل نامعتبر است'}],
            value: this.currentUser.email
          },
        ], {width: '900px', rtl: this.fa}
      );
      dialogRef.onClose.subscribe(async (res: any) => {
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
    const dialogRef = this.utilsService.showDialogForm('تغییر رمز عبور',
      [
        {
          type: 'password',
          formControlName: 'current_password',
          label: 'پسورد فعلی',
          className: 'col-12',
          errors: [{type: 'required', message: 'این فیلد الزامیست'}]
        },
        {
          type: 'password',
          formControlName: 'new_password',
          label: 'پسورد جدید',
          className: 'col-12',
          errors: [{type: 'required', message: 'این فیلد الزامیست'}]
        },
        {
          type: 'password',
          formControlName: 'confirm_password',
          label: 'تکرار رمز جدید',
          className: 'col-12',
          errors: [{type: 'required', message: 'این فیلد الزامیست'}]
        },
      ], {
        width: '600px',
        rtl: this.fa,
        formValidator: {
          validatorFn: this.checkPasswords,
          error: 'notSame',
          message: 'رمزعبور و تکرار مطابقت ندارند'
        }
      });
    dialogRef.onClose.subscribe(async (res: any) => {
      if (res) {
        await this.authService.updatePassword(res).toPromise();
      }
    });
  }

  getColor() {
    return this.sessionService.getProfileColor(this.currentUser.id);
  }
}
