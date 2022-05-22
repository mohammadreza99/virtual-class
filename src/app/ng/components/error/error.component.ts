import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {UpdateViewService} from '@core/utils';

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

  async reloadPage() {
    await this.router.navigateByUrl('/');
    document.location.reload();
  }

}
