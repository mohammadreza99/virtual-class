import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {UtilsService} from '@ng/services';

@Component({
  selector: 'ng-no-internet',
  templateUrl: './no-internet.component.html',
  styleUrls: ['./no-internet.component.scss']
})
export class NoInternetComponent implements OnInit {

  constructor(private route: ActivatedRoute,
              private utilsService: UtilsService,
              private router: Router) {
  }


  ngOnInit(): void {
    this.utilsService.disableWindowBackButton();
  }

  navigate() {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (!navigator.onLine) {
      return;
    }
    this.router.navigateByUrl(returnUrl);
  }
}
