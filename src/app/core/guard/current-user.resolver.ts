import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot} from '@angular/router';
import {AuthService} from '@core/http';
import {UtilsService} from '@ng/services';

@Injectable({
  providedIn: 'root'
})
export class CurrentUserResolver implements Resolve<void> {
  constructor(private authService: AuthService, private router: Router, private utilsService: UtilsService) {
  }

  async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<void> {
    try {
      const data = await this.authService.getSelfUser().toPromise();
      this.authService.currentUser = data.data.user;
      document.body.style.backgroundColor = '#ffffff';
      return;
    } catch (error) {
      await this.router.navigateByUrl('/');
      await this.utilsService.showDialog({message: 'مشکلی بوجود آمده است'});
    }
  }
}
