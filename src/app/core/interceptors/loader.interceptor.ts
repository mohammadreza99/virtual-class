import {Injectable} from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse,
} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Subscriber} from 'rxjs';
import {LoaderService} from '@core/utils';
import {logger} from 'codelyzer/util/logger';
import {requests} from '@core/requests.config';

@Injectable()
export class LoaderInterceptor implements HttpInterceptor {

  constructor(private loaderService: LoaderService) {
  }

  private requests: HttpRequest<any>[] = [];

  removeRequest(req: HttpRequest<any>) {
    const i = this.requests.indexOf(req);
    if (i >= 0) {
      this.requests.splice(i, 1);
    }
    this.loaderService.isLoading.next(this.requests.length > 0);
  }

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const hasLoadingFalseParam = req.params.get('loading')?.toLocaleLowerCase() == 'false';
    const shouldShowLoading = requests.filter(r => r.loading).findIndex(x => x.method == req.body?.method) > -1;
    if (shouldShowLoading) {
      this.requests.push(req);
      this.loaderService.isLoading.next(true);
    } else {
      this.loaderService.isLoading.next(false);
    }

    return new Observable(
      (observer: Subscriber<HttpEvent<any>>): (() => void) => {
        const subscription = next.handle(req).subscribe(
          (event: HttpEvent<any>) => {
            if (event instanceof HttpResponse) {
              this.removeRequest(req);
              observer.next(event);
            }
          },
          (err: any) => {
            this.removeRequest(req);
            observer.error(err);
          },
          () => {
            this.removeRequest(req);
            observer.complete();
          }
        );
        return (): void => {
          this.removeRequest(req);
          subscription.unsubscribe();
        };
      }
    );
  }
}
