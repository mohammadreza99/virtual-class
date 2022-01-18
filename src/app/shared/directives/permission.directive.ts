import {Directive, ElementRef, Input, OnInit, TemplateRef, ViewContainerRef,} from '@angular/core';
import {SessionService} from '@core/http';

@Directive({
  selector: '[ngPermission]',
})
export class PermissionDirective implements OnInit {
  constructor(
    private elementRef: ElementRef,
    private sessionService: SessionService,
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
  ) {
  }

  @Input('ngPermission') permission: 'Admin' | 'Viewer';

  ngOnInit(): void {
    if (this.sessionService.currentUser.role !== this.permission) {
      this.viewContainer.clear();
    } else {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }
}
