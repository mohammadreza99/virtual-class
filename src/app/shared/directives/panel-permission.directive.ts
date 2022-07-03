import {Directive, ElementRef, Input, OnInit, TemplateRef, ViewContainerRef,} from '@angular/core';
import {AuthService} from '@core/http';

@Directive({
  selector: '[ngPanelPermission]',
})
export class PanelPermissionDirective implements OnInit {
  constructor(
    private elementRef: ElementRef,
    private authService: AuthService,
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
  ) {
  }

  @Input('ngPanelPermission') permission: 'Owner' | 'User';

  ngOnInit(): void {
    if (this.authService.currentUser.role !== this.permission) {
      this.viewContainer.clear();
    } else {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }
}
