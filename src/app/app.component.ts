import {Component, OnInit} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {ActivatedRoute, ActivationStart, Router} from '@angular/router';
import {filter} from 'rxjs/operators';
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


  ngOnInit() {
    this.checkNetworkStatus();
    this.router.events
      .pipe(filter((e: any) => e instanceof ActivationStart))
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
    this.utilsService.checkConnection().subscribe(status => {
      if (status == false) {
        console.log('......NETWORK DISCONNECTED......');
        this.sessionService.getMeOut(null, false);
        if (this.router.url == '/no-internet') {
          return;
        }
        this.router.navigate(['/no-internet'], {queryParams: {returnUrl: this.router.url}});
      }
    });
  }
}
