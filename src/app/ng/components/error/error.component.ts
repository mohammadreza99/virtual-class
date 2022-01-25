import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {UpdateViewService} from '@core/http/update-view.service';

@Component({
  selector: 'ng-error',
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.scss']
})
export class ErrorComponent implements OnInit {
  message: string = 'خطایی رخ داده است';

  constructor(private router: Router, private updateViewService: UpdateViewService) {
  }

  ngOnInit(): void {
  }

  reloadPage() {
    this.updateViewService.setViewEvent({event: 'closeSidebar', data: {value: true}});
    setTimeout(async () => {
      await this.router.navigateByUrl('/');
      document.location.reload();
    }, 100);
  }

}
