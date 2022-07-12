import {Component, OnInit} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, ValidationErrors, Validators} from '@angular/forms';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {AuthService} from '@core/http';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'ng-set-password',
  templateUrl: './set-password.page.html',
  styleUrls: ['./set-password.page.scss']
})
export class SetPasswordPage extends LanguageChecker implements OnInit {

  constructor(private authService: AuthService, private route: ActivatedRoute, private router: Router) {
    super();
  }

  form = new FormGroup({
    password: new FormControl(null, [Validators.required]),
    confirm_password: new FormControl(null, [Validators.required]),
  }, {validators: this.checkPasswords});

  ngOnInit(): void {
  }

  async onSubmit(callback: any) {
    try {
      if (this.form.valid) {
        const token = this.route.snapshot.paramMap.get('token');
        const res = await this.authService.setPassword(this.form.value.password, token).toPromise();
        callback();
        this.router.navigate(['/auth/login'], {queryParams: {companyId: res.data.company_id}});
      }
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
