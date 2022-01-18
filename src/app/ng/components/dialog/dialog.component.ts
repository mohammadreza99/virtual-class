import {Component, EventEmitter, OnInit, Output, ViewContainerRef} from '@angular/core';
import {NgDialog} from '@ng/models/overlay';
import {UtilsService} from '@ng/services';
import {Subject} from 'rxjs';

@Component({
  selector: 'ng-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.scss']
})
export class DialogComponent {

  private _onHide = new Subject();
  onHide = this._onHide.asObservable();

  options: NgDialog = {
    autoZIndex: true,
    baseZIndex: 20000,
    blockScroll: true,
    rtl: true,
    closable: true,
    closeIcon: 'pi pi-times',
    closeOnEscape: false,
    contentStyleClass: null,
    dismissableMask: false,
    draggable: false,
    focusOnShow: true,
    focusTrap: true,
    keepInViewport: true,
    maskStyleClass: null,
    maximizable: false,
    maximizeIcon: 'pi pi-window-maximize',
    minX: 0,
    minY: 0,
    minimizeIcon: 'pi pi-window-minimize',
    modal: true,
    position: 'center',
    buttonLabel: 'Ok',
    resizable: true,
    showHeader: true,
    styleClass: null,
    transitionOptions: '150ms',
  };
  visible: boolean = false;

  onButtonClick() {
    this.visible = false;
    this._onHide.next();
  }
}
