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
      await this.sessionService.initRoom(roomId);
      document.body.style.backgroundColor = '#40414A';
    } catch (error) {
      console.error(error);
      this.utilsService.showDialog({message: 'مشکلی بوجود آمده است'});
    }
  }
}
