import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class EnterRoomGuard implements CanActivate {
  constructor(private router: Router) {
  }

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Promise<boolean> {
    const roomId = +route.paramMap.get('roomId');
    const roomEnterTime = +localStorage.getItem('roomEnterTime');
    if (!roomEnterTime || (roomEnterTime && (Date.now() - roomEnterTime > 1000))) {
      await this.router.navigate(['/vc/room-info', roomId]);
      return false;
    }
    return true;
  }

}
