import {Component, OnInit} from '@angular/core';
import {NgConfirmOptions} from '@ng/models/overlay';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';

@Component({
  selector: 'ng-confirm',
  templateUrl: './confirm.component.html',
  styleUrls: ['./confirm.component.scss'],
})
export class ConfirmComponent extends LanguageChecker implements OnInit {
  options: NgConfirmOptions = {
    message: null,
    key: null,
    icon: null,
    acceptLabel: this.fa ? 'بله' : 'Yes',
    rejectLabel: this.fa ? 'خیر' : 'No',
    rejectAppearance: 'outlined',
    rejectColor: 'secondary',
    acceptIcon: null,
    rejectIcon: null,
    closable: true,
    rtl: false,
    acceptVisible: true,
    rejectVisible: true,
    width: '450px'
  };

  constructor() {
    super();
  }

  ngOnInit() {
  }
}
