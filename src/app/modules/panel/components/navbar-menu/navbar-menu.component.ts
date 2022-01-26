import {Component, EventEmitter, HostListener, Input, OnInit, Output} from '@angular/core';
import {Router} from '@angular/router';
import {UtilsService} from '@ng/services';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {MenuItem} from 'primeng/api';
import {User} from '@core/models';
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
          this.authService.logout();
          this.router.navigate(['/auth/login']);
        }
      }
    }
  ];
  sidebarItems: MenuItem[];

  @HostListener('window:resize', ['$event']) onResize(e) {
    this.handleResize();
  }

  @Input() user: User;
  @Input() sidebarVisible: boolean;
  @Input() sidebarLock: boolean;
  @Input() menuType: string;
  @Output() sidebarVisibleChange = new EventEmitter();
  @Output() sidebarLockChange = new EventEmitter();
  @Output() menuTypeChange = new EventEmitter();

  constructor(
    private router: Router,
    private utilsService: UtilsService,
    private authService: AuthService,
  ) {
    super();
  }

  ngOnInit() {
    if (localStorage.getItem('menuLock')) {
      const sidebarLock = JSON.parse(localStorage.getItem('menuLock'));
      this.sidebarLock = sidebarLock != undefined ? sidebarLock : false;
      this.sidebarVisible = this.sidebarLock;
    }
    this.user = this.authService.currentUser;
    const allSidebarItems = [
      {
        label: this.translations.userList,
        routerLink: '/user-list',
        icon: 'icon-user-groups'
      },
      {
        label: this.translations.groupList,
        routerLink: 'groups',
        icon: 'icon-user-groups'
      },
      {
        label: this.translations.roomList,
        routerLink: 'rooms',
        icon: 'icon-camera'
      },
      {
        label: this.translations.profile,
        routerLink: 'profile',
        icon: 'icon-profile'
      }
    ];
    if (this.user.role == 'User') {
      this.sidebarItems = [
        {
          label: this.translations.roomList,
          routerLink: 'rooms',
          icon: 'icon-camera'
        },
        {
          label: this.translations.profile,
          routerLink: 'profile',
          icon: 'icon-profile'
        }
      ];
    } else {
      this.sidebarItems = allSidebarItems;
    }
    for (const item of this.sidebarItems) {
      this.assignSidebarCloseFunc(item);
    }
    this.handleResize();
    this.toggleSidebarLock(this.sidebarLock);
  }

  handleSidebarToggler() {
    this.sidebarVisible = !this.sidebarVisible;
    this.toggleSidebarVisible(this.sidebarVisible);
  }

  handleSidebarLockToggler() {
    this.sidebarLock = !this.sidebarLock;
    localStorage.setItem('menuLock', this.sidebarLock.toString());
    this.toggleSidebarLock(this.sidebarLock);
  }

  toggleSidebarVisible(activate: boolean) {
    this.sidebarVisible = activate;
    this.sidebarVisibleChange.emit(this.sidebarVisible);
  }

  toggleSidebarLock(activate: boolean) {
    this.sidebarLock = activate;
    this.sidebarLockChange.emit(this.sidebarLock);
  }

  toggleMenuType(menuType: string) {
    this.menuType = menuType;
    this.menuTypeChange.emit(this.menuType);
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

  handleResize() {
    if (window.innerWidth <= 767) {
      this.menuType = 'overlay';
      this.sidebarVisible = false;
      this.sidebarLock = false;
    } else {
      this.menuType = 'static';
    }
    this.toggleMenuType(this.menuType);
    this.toggleSidebarVisible(this.sidebarVisible);
    this.toggleSidebarLock(this.sidebarLock);
  }
}
