import {Component, OnInit} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {ActivatedRoute, ActivationStart, Router} from '@angular/router';
import {filter, tap} from 'rxjs/operators';
import {UtilsService} from '@ng/services';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {MessageService} from '@core/utils';
import {SessionService, SocketService} from '@core/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent extends LanguageChecker implements OnInit {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private title: Title,
    private utilsService: UtilsService,
    private sessionService: SessionService,
    private socketService: SocketService,
    private messageService: MessageService,
  ) {
    super();
  }

  currentUrl: string;

  ngOnInit() {
    this.checkNetworkStatus();
    this.router.events
      .pipe(filter((e: any) => e instanceof ActivationStart), tap(e => {
        this.currentUrl = e.snapshot.routeConfig.path;
      }))
      .subscribe((event: ActivatedRoute) => {
        const data = event.snapshot.data;
        if (data?.title) {
          this.title.setTitle(this.instant(data.title));
        }
      });

    this.messageService.getMessage().subscribe(res => {
      if (res.detail) {
        this.utilsService.showToast({
          severity: res.severity,
          detail: this.instant(res.detail) || '',
        });
      }
    });
  }

  checkNetworkStatus() {
    this.utilsService.checkOnlineState().subscribe(async status => {
      if (this.currentUrl == 'no-internet') {
        return;
      }
      if (status == false) {
        console.log(`%cNETWORK DISCONNECTED`, `font-size:0.85rem;color: #856404;background-color: #fff3cd;border:1px solid #ffeeba; padding: 5px;border-radius: 0.25rem;`);
        await this.sessionService.getMeOut(null, false);
        this.router.navigate(['/no-internet'], {queryParams: {returnUrl: this.router.url}});
      }
    });
  }
}
