import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Router} from '@angular/router';
import {UtilsService} from '@ng/services';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {MenuItem} from 'primeng/api';
import {User} from '@core/models';
import {UpdateViewService} from '@core/http/update-view.service';
import {AuthService} from '@core/http';

@Component({
  selector: 'navbar-menu',
  templateUrl: './navbar-menu.component.html',
  styleUrls: ['./navbar-menu.component.scss']
})
export class NavbarMenuComponent
  extends LanguageChecker
  implements OnInit {

  accountItems: MenuItem[] = [
    {
      label: this.translations.exit,
      icon: 'pi pi-sign-out',
      command: async (event) => {
        const dialogRes = await this.utilsService.showConfirm(
          {
            header: this.translations.exit,
            message: this.translations.exitConfirmBody,
            acceptLabel: this.translations.yes,
            rejectLabel: this.translations.no,
            rtl: this.fa
          },
        );
        if (dialogRes) {
          this.updateViewService.setViewEvent({event: 'closeSidebar', data: true});
          this.authService.logout();
          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 20);
        }
      }
    }
  ];
  selectedLanguage = this.translationService.getDefaultLang();
  selectedTheme = 'saga-blue';
  themes: any[];
  sidebarItems: MenuItem[];


  @Input('sidebarItems') set setSidebarItems(items: MenuItem[]) {
    this.sidebarItems = items;
    for (const item of this.sidebarItems) {
      this.assignSidebarCloseFunc(item);
    }
  };

  @Input() user: User;
  @Input() sidebarVisible: boolean;
  @Output() sidebarVisibleChange = new EventEmitter();
  @Input() sidebarLock: boolean;
  @Output() sidebarLockChange = new EventEmitter();
  @Input() menuType: string;

  constructor(
    private router: Router,
    private utilsService: UtilsService,
    private authService: AuthService,
    private updateViewService: UpdateViewService,
  ) {
    super();
  }

  ngOnInit() {
    this.toggleSidebarLock(this.sidebarLock);
    this.loadThemes();
  }

  changeTheme(event) {
    const themeElement = document.getElementById('theme-link');
    themeElement.setAttribute(
      'href',
      themeElement.getAttribute('href').replace(this.selectedTheme, event.value)
    );
    this.selectedTheme = event.value;
  }

  async onLangChange(event) {
    await this.translationService.use(event.value).toPromise();
    this.selectedLanguage = event.value;
  }

  handleSidebarToggler() {
    this.sidebarVisible = !this.sidebarVisible;
    this.toggleSidebar(this.sidebarVisible);
  }

  handleSidebarLockToggler() {
    this.sidebarLock = !this.sidebarLock;
    this.toggleSidebarLock(this.sidebarLock);
  }

  toggleSidebar(activate: boolean) {
    this.sidebarVisible = activate;
    this.sidebarVisibleChange.emit(this.sidebarVisible);
  }

  toggleSidebarLock(activate: boolean) {
    this.sidebarLock = activate;
    this.sidebarLockChange.emit(this.sidebarLock);
  }

  loadThemes() {
    const themes = [
      'arya-blue',
      'arya-green',
      'arya-orange',
      'arya-purple',
      'bootstrap4-dark-blue',
      'bootstrap4-dark-purple',
      'bootstrap4-light-blue',
      'bootstrap4-light-purple',
      'fluent-light',
      'lara-dark-indigo',
      'lara-dark-purple',
      'lara-light-indigo',
      'lara-light-purple',
      'luna-amber',
      'luna-blue',
      'luna-green',
      'luna-pink',
      'md-dark-deeppurple',
      'md-dark-indigo',
      'md-light-deeppurple',
      'md-light-indigo',
      'mdc-dark-deeppurple',
      'mdc-dark-indigo',
      'mdc-light-deeppurple',
      'mdc-light-indigo',
      'mira',
      'nano',
      'nova',
      'nova-accent',
      'nova-alt',
      'rhea',
      'saga-blue',
      'saga-green',
      'saga-orange',
      'saga-purple',
      'soho-dark',
      'soho-light',
      'tailwind-light',
      'vela-blue',
      'vela-green',
      'vela-orange',
      'vela-purple',
      'viva-dark',
      'viva-light',
    ];
    this.themes = themes.map((t, i) => ({label: `${i + 1}-${t}`, value: t}));
  }

  assignSidebarCloseFunc(item: MenuItem) {
    if (item.routerLink) {
      Object.assign(item, {
        command: () => {
          if (!this.sidebarLock && this.menuType == 'overlay') {
            this.sidebarVisible = false;
          }
          this.sidebarVisibleChange.emit(this.sidebarVisible);
        }
      });
    }
  }

  get isModalSidebar() {
    return (this.menuType == 'overlay' || this.menuType == 'overlay-mask' || this.menuType == 'push' || this.menuType == 'push-mask');
  }
}
