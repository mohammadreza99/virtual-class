import {Injectable} from '@angular/core';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError, tap} from 'rxjs/operators';
import {Router} from '@angular/router';
import {MessageService} from '@core/utils';
import {requests} from '@core/requests.config';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  constructor(private router: Router, private messageService: MessageService) {
  }

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const hasSuccessMessageApis = requests.filter(r => r.success);
    const hasFailureMessageApis = requests.filter(r => r.failure);
    return next.handle(request).pipe(
      tap((event: any) => {
        const method = request.body?.method;
        const status = event.body?.status;
        if (status == 'OK') {
          if (hasSuccessMessageApis.findIndex(x => x.method == method) >= 0) {
            this.showSuccessToast();
          }
        }
        if (status != 'OK' && !request.url.includes('.json')) {
          if (hasFailureMessageApis.findIndex(x => x.method == method) >= 0) {
            this.showFailureToast(status);
          }
          if (status == 'NOT_FOUND') {
            // this.router.navigateByUrl('/404');
          }
        }
        return event;
      }),
      catchError((error: any) => {
        if (error) {
          console.error(error);
          this.showFailureToast(error);
          return throwError(error);
        }
      }),
    );
  }

  showSuccessToast() {
    this.messageService.nextMessage({
      severity: 'success',
      detail: 'doneSuccessfully'
    });
  }

  showFailureToast(status) {
    this.messageService.nextMessage({
      severity: 'error',
      ...this.getErrorMessage(status)
    });
  }

  getErrorMessage(status: string): any {
    switch (status) {
      case 'NOT_EMPTY':
        return {
          detail: 'notEmptyError',
        };
      case 'UNAUTHENTICATED':
        return {
          detail: 'unAuthenticatedError',
        };
      case 'ACCESS_DENIED':
        return {
          detail: 'accessDeniedError',
        };
      case 'WRONG_CREDENTIAL':
        return {
          detail: 'wrongCredential',
        };
      default:
        if (status != undefined) {
          return {
            detail: 'errorOccurred',
          };
        }
    }
  }
}
