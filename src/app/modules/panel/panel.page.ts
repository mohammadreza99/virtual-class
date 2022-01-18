import {Component, HostListener, OnInit} from '@angular/core';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {User} from '@core/models';
import {AuthService, SessionService} from '@core/http';
import {MenuItem} from 'primeng/api';
import {UpdateViewService} from '@core/http/update-view.service';

@Component({
  selector: 'main-page',
  styleUrls: ['panel.page.scss'],
  templateUrl: './panel.page.html',
})
export class PanelPage extends LanguageChecker implements OnInit {
  constructor(private authService: AuthService, private updateViewService: UpdateViewService) {
    super();
  }

  sidebarVisible = false;
  sidebarLock = false;
  currentUser: User;
  sidebarItems: MenuItem[];
  menuType: string;

  @HostListener('window:resize', ['$event']) onResize(e) {
    this.handleResize();
  }

  ngOnInit(): void {
    this.handleResize();
    this.currentUser = this.authService.currentUser;
    const allSidebarItems = [
      {
        label: 'لیست کاربران',
        routerLink: '/user-list',
        icon: 'icon-user-groups'
      },
      {
        label: 'لیست گروه ها',
        routerLink: 'group-list',
        icon: 'icon-user-groups'
      },
      {
        label: 'لیست اتاق ها',
        routerLink: 'room-list',
        icon: 'icon-camera'
      },
      {
        label: 'پروفایل',
        routerLink: 'profile',
        icon: 'icon-profile'
      }
    ];
    if (this.currentUser.role == 'User') {
      this.sidebarItems = [
        {
          label: 'لیست اتاق ها',
          routerLink: 'room-list',
          icon: 'icon-camera'
        },
        {
          label: 'پروفایل',
          routerLink: 'profile',
          icon: 'icon-profile'
        }
      ];
    } else {
      this.sidebarItems = allSidebarItems;
    }
    this.updateViewService.getViewEvent().subscribe(res => {
      switch (res.event) {
        case 'closeSidebar':
          this.sidebarVisible = false;
          break;
      }
    });
  }

  handleResize() {
    if (window.innerWidth < 767) {
      this.onMenuTypeChange('overlay');
      this.toggleOverlayDisplay(false);
    } else {
      this.onMenuTypeChange('static');
    }
  }

  toggleSidebar(event: any) {
    const el = event.currentTarget as HTMLElement;
    const sidebar = el.parentElement;
    sidebar.classList.toggle('open');
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

  onMenuTypeChange(event: any) {
    this.menuType = event;
    if (this.menuType == 'hover') {
      this.sidebarVisible = true;
    } else {
      this.onSidebarVisibleChange(false);
    }
    this.onSidebarLockChange(false);
  }

  onSidebarVisibleChange(event: any) {
    this.sidebarVisible = event;
    if (this.menuType == 'overlay' || this.menuType == 'push') {
      setTimeout(() => {
        if (this.sidebarVisible) {
          this.toggleOverlayVisibility(false);
        }
      }, 0);
    }
  }

  onSidebarLockChange(event: any) {
    this.sidebarLock = event;
    if (this.menuType == 'overlay' || this.menuType == 'overlay-mask' || this.menuType == 'push' || this.menuType == 'push-mask') {
      this.toggleOverlayDisplay(!event);
    }
  }

  toggleOverlayDisplay(activate: boolean) {
    const overlay = document.querySelector('.p-sidebar-mask');
    const body = document.body;
    if (activate) {
      overlay?.classList.remove('d-none');
      body.classList.add('p-overflow-hidden');
    } else {
      overlay?.classList.add('d-none');
      body.classList.remove('p-overflow-hidden');
    }
  }

  toggleOverlayVisibility(activate: boolean) {
    const overlay = document.querySelector('.p-sidebar-mask') as any;
    if (overlay) {
      if (activate) {
        overlay.style.transitionDuration = '0.2ms';
        overlay.style.opacity = 1;
      } else {
        overlay.style.transitionDuration = '0ms';
        overlay.style.opacity = 0;
      }
    }
  }
}
