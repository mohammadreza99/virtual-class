import {Component, OnInit} from '@angular/core';
import {FormGroup, FormControl, Validators} from '@angular/forms';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {AuthService} from '@core/http';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'ag-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage extends LanguageChecker implements OnInit {
  constructor(private authService: AuthService, private router: Router, private route: ActivatedRoute) {
    super();
  }

  form = new FormGroup({
    email: new FormControl(null, [Validators.required, Validators.email]),
    password: new FormControl(null, [Validators.required]),
    remember_me: new FormControl(true),
  });

  ngOnInit() {
  }

  async onSubmit(callback: any) {
    try {
      if (this.form.valid) {
        const companyId = this.route.snapshot.queryParamMap.get('companyId');
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        const {data} = await this.authService.login({...this.form.value, company_id: companyId || 8}).toPromise();
        if (data.token) {
          localStorage.setItem('token', data.token);
          this.router.navigate([returnUrl || '/room-list']);
        }
      }
      callback();
    } catch (e) {
      callback();
    }
  }
}
