import {Component} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, ValidationErrors, Validators} from '@angular/forms';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {AuthService} from '@core/http';
import {Router} from '@angular/router';

@Component({
  selector: 'ng-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage extends LanguageChecker {
  constructor(private authService: AuthService, private router: Router) {
    super();
  }

  step: number = 1;
  step1Form = new FormGroup({
    first_name: new FormControl(null, [Validators.required]),
    last_name: new FormControl(null, [Validators.required]),
  });
  step2Form = new FormGroup({
    password: new FormControl(null, [Validators.required]),
    confirm_password: new FormControl(null, [Validators.required]),
  }, {validators: this.checkPasswords});
  step3Form = new FormGroup({
    email: new FormControl(null, [Validators.required, Validators.email]),
    phone_number: new FormControl(null, [Validators.required, Validators.minLength(11), Validators.pattern('(0|\\+98)?([ ]|,|-|[()]){0,2}9[1|2|3|4]([ ]|,|-|[()]){0,2}(?:[0-9]([ ]|,|-|[()]){0,2}){8}')]),
  });


  goToStep(step: number) {
    if (step === 0) {
      this.router.navigate(['/auth/login']);
    } else {
      this.step = step;
    }
  }

  async onSubmit(callback: any) {
    try {
      const registerData = {...this.step1Form.value, ...this.step2Form.value, ...this.step3Form.value};
      const res = await this.authService.register(registerData).toPromise();
      this.router.navigate(['/auth/login']);
      callback();
    } catch (e) {
      callback();
    }
  }

  checkPasswords(group: AbstractControl): ValidationErrors | null {
    const pass = group.get('password').value;
    const confirmPass = group.get('confirm_password').value;
    return pass === confirmPass ? null : {notSame: true};
  }
}
