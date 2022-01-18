import {Component} from '@angular/core';
import {NgToastOptions} from '@ng/models/overlay';

@Component({
  selector: 'ng-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss'],
})
export class ToastComponent {

  options: NgToastOptions = {
    rtl: true,
    position: 'top-right',
    preventDuplicates: false
  };
}
