import {Component, OnInit} from '@angular/core';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {AuthService} from '@core/http';

@Component({
  selector: 'main-page',
  styleUrls: ['panel.page.scss'],
  templateUrl: './panel.page.html',
})
export class PanelPage extends LanguageChecker implements OnInit {
  constructor() {
    super();
  }

  sidebarLock: boolean = false;
  sidebarVisible: boolean = false;
  menuType: string = 'static';

  ngOnInit(): void {
  }

  getClasses() {
    let classes = `menu-${this.menuType}`;
    if (this.fa) {
      classes += ' rtl ';
    }
    if (this.sidebarLock) {
      classes += ' sidebar-lock ';
    }
    if (this.sidebarVisible) {
      classes += ' sidebar-open ';
    }
    return classes;
  }
}
