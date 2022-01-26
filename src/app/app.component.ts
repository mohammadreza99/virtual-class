import {Component, OnInit} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {ActivatedRoute, ActivationStart, Router} from '@angular/router';
import {filter} from 'rxjs/operators';
import {UtilsService} from '@ng/services';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {MessageService} from '@core/utils';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent extends LanguageChecker implements OnInit {
  constructor(
    private router: Router,
    private title: Title,
    private utilsService: UtilsService,
    private messageService: MessageService,
  ) {
    super();
  }

  ngOnInit() {
    this.checkNetworkStatus();
    this.router.events
      .pipe(filter((e: any) => e instanceof ActivationStart))
      .subscribe((event: ActivatedRoute) => {
        const data = event.snapshot.data;
        if (data?.title) {
          this.title.setTitle(this.translations[data.title]);
        }
      });

    this.messageService.getMessage().subscribe(res => {
      if (res.detail) {
        this.utilsService.showToast({
          severity: res.severity,
          detail: this.translations[res.detail] || '',
        });
      }
    });
  }

  checkNetworkStatus() {
    this.utilsService.checkConnection().subscribe(status => {
      if (status == false) {
        // this.router.navigateByUrl('/error');
      }
    });
  }
}
