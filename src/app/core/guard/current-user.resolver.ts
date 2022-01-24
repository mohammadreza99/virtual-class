import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router';
import {AuthService} from '@core/http';

@Injectable({
  providedIn: 'root'
})
export class CurrentUserResolver implements Resolve<void> {
  constructor(private authService: AuthService) {
  }

  async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<void> {
    const data = await this.authService.getSelfUser().toPromise();
    this.authService.currentUser = data.data.user;
    return;
  }
}
