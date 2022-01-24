import {Injectable} from '@angular/core';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError, tap} from 'rxjs/operators';
import {Router} from '@angular/router';
import {UtilsService} from '@ng/services';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  constructor(private router: Router, private utilsService: UtilsService) {
  }

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const hasSuccessMessageApis = ['createRoom', 'generateRoomLink'];
    const hasFailureMessageApis = [];
    return next.handle(request).pipe(
      tap((event: any) => {
        const method = request.body?.method;
        const status = event.body?.status;
        if (status == 'OK') {
          if (hasSuccessMessageApis.findIndex(x => method == x) >= 0) {
            this.showSuccessToast();
          }
        }
        if (status != 'OK' && !request.url.includes('.json')) {
          if (hasFailureMessageApis.findIndex(x => method == x) >= 0) {
            this.showFailureToast(status);
          }
          if (status == 'NOT_FOUND') {
            this.router.navigateByUrl('/404');
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
    this.utilsService.showToast({
      severity: 'success',
      summary: 'با موفقیت انجام شد'
    });
  }

  showFailureToast(status) {
    this.utilsService.showToast({
      severity: 'error',
      ...this.getErrorMessage(status)
    });
  }

  getErrorMessage(code: string): any {
    switch (code) {
      case 'NOT_EMPTY':
      case 'UNAUTHENTICATED':
        return {
          detail: code,
        };
      default:
        return {
          detail: 'خطایی رخ داده است',
        };
    }
  }
}
