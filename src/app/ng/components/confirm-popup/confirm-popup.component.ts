import {Component, OnInit} from '@angular/core';
import {NgConfirmPopupOptions} from '@ng/models/overlay';
import {ConfirmationService} from 'primeng/api';

@Component({
  selector: 'ng-confirm-popup',
  templateUrl: './confirm-popup.component.html',
  styleUrls: ['./confirm-popup.component.scss'],
})
export class ConfirmPopupComponent {
  options: NgConfirmPopupOptions = {
    target: null,
    message: null,
    key: null,
    icon: null,
    acceptLabel: null,
    rejectLabel: null,
    acceptIcon: null,
    rejectIcon: null,
    acceptVisible: true,
    rejectVisible: true,
    defaultFocus: 'accept',
  };
}
