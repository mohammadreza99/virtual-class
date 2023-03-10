import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot} from '@angular/router';
import {SessionService} from '@core/http';
import {UtilsService} from '@ng/services';

@Injectable({
  providedIn: 'root'
})
export class RoomResolver implements Resolve<void> {
  constructor(private sessionService: SessionService, private router: Router, private utilsService: UtilsService) {
  }

  async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<void> {
    const roomId = +route.paramMap.get('roomId');
    try {
      await this.sessionService.checkSession(roomId);
    } catch (error) {
      this.router.navigate(['vc/room-info', roomId]);
      console.error(error);
    }
  }
}
