import {Component, OnInit, Output, ViewChild, EventEmitter} from '@angular/core';
import {OverlayPanel} from 'primeng/overlaypanel';

@Component({
  selector: 'ng-vc-footer',
  templateUrl: './vc-footer.component.html',
  styleUrls: ['./vc-footer.component.scss']
})
export class VcFooterComponent implements OnInit {

  constructor() {
  }

  @ViewChild(OverlayPanel, {static: true}) overlay: OverlayPanel;
  @Output() togglerClick = new EventEmitter();
  toggleSidebar: boolean = false;

  ngOnInit(): void {
  }

  onClick(event: any, viewModes: OverlayPanel) {
    this.overlay.show(event);
  }

  onTogglerClick() {
    this.toggleSidebar = !this.toggleSidebar;
    this.togglerClick.emit(this.toggleSidebar);
  }
}
