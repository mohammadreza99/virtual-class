import {Injectable} from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanActivateChild,
  CanLoad,
  Route,
  Router,
  RouterStateSnapshot,
  UrlSegment
} from '@angular/router';
import {AuthService} from '@core/http';

@Injectable({
  providedIn: 'root'
})
export class LimitModeGuard implements CanActivate, CanActivateChild, CanLoad {
  constructor(private router: Router, private authService: AuthService) {
  }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    if (!this.authService.isLimitMode()) {
      return true;
    } else {
      this.router.navigate(['/404']);
      return false;
    }
  }

  canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (!this.authService.isLimitMode()) {
      return true;
    } else {
      this.router.navigate(['/404']);
      return false;
    }
  }

  canLoad(route: Route, segments: UrlSegment[]): boolean {
    if (!this.authService.isLimitMode()) {
      return true;
    } else {
      this.router.navigate(['/404']);
      return false;
    }
  }
}
