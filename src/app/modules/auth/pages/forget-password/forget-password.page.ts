import {Component, OnInit} from '@angular/core';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {AuthService} from '@core/http';

@Component({
  selector: 'ng-forget-password',
  templateUrl: './forget-password.page.html',
  styleUrls: ['./forget-password.page.scss']
})
export class ForgetPasswordPage extends LanguageChecker implements OnInit {

  constructor(private authService: AuthService) {
    super();
  }

  form = new FormGroup({
    email: new FormControl(null, [Validators.required, Validators.email])
  });

  ngOnInit(): void {
  }

  async onSubmit(callback: any) {
    try {
      if (this.form.valid) {
        const {data} = await this.authService.login({...this.form.value}).toPromise();
        if (data.token) {
        }
      }
      callback();
    } catch (e) {
      callback();
    }
  }
}
