import {
  ApplicationRef,
  ComponentFactoryResolver,
  ComponentRef,
  EmbeddedViewRef,
  Injectable,
  Injector,
  Type
} from '@angular/core';
import {ConfirmPopupComponent} from '@ng/components/confirm-popup/confirm-popup.component';
import {ConfirmComponent} from '@ng/components/confirm/confirm.component';
import {DialogFormComponent} from '@ng/components/dialog-form/dialog-form.component';
import {MessageComponent} from '@ng/components/message/message.component';
import {ToastComponent} from '@ng/components/toast/toast.component';
import {
  NgConfirmOptions,
  NgConfirmPopupOptions,
  NgDialog,
  NgDialogFormConfig,
  NgDialogFormOptions,
  NgMessage,
  NgMessageOptions,
  NgToastOptions
} from '@ng/models/overlay';
import {ConfirmationService, FilterService, MessageService} from 'primeng/api';
import {DialogService, DynamicDialogRef} from 'primeng/dynamicdialog';
import {fromEvent, merge, Observable, Observer} from 'rxjs';
import {map} from 'rxjs/operators';
import {DialogComponent} from '@ng/components/dialog/dialog.component';
import {LocationStrategy} from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {
  private messageCmpRef: ComponentRef<MessageComponent>;
  private toastCmpRef: ComponentRef<ToastComponent>;
  private confirmPopupCmpRef: ComponentRef<ConfirmPopupComponent>;
  private confirmCmpRef: ComponentRef<ConfirmComponent>;
  private dialogCmpRef: ComponentRef<DialogComponent>;

  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private dialogService: DialogService,
    private resolver: ComponentFactoryResolver,
    private filterService: FilterService,
    private injector: Injector,
    private appRef: ApplicationRef,
    private location: LocationStrategy,
  ) {
  }

  //////////////////////////////////////////////////////////////////////////
  //                              MESSAGE                                 //
  //////////////////////////////////////////////////////////////////////////
  showMessage(message: NgMessage, options?: NgMessageOptions): void {
    if (!document.body.contains((this.messageCmpRef?.hostView as EmbeddedViewRef<any>)?.rootNodes[0])) {
      this.messageCmpRef = this.addComponentToBody(MessageComponent, 'prepend');
    }
    Object.assign(this.messageCmpRef.instance.options, options);
    setTimeout(() => {
      this.messageService.add(message);
    }, 0);
  }

  //////////////////////////////////////////////////////////////////////////
  //                                TOAST                                 //
  //////////////////////////////////////////////////////////////////////////
  showToast(message: NgMessage, options?: NgToastOptions): void {
    if (!document.body.contains((this.toastCmpRef?.hostView as EmbeddedViewRef<any>)?.rootNodes[0])) {
      this.toastCmpRef = this.addComponentToBody(ToastComponent);
    }
    Object.assign(this.toastCmpRef.instance.options, options);
    setTimeout(() => {
      this.messageService.add(message);
    }, 0);
  }

  clear() {
    this.messageService.clear();
  }

  //////////////////////////////////////////////////////////////////////////
  //                           CONFIRM POPUP                              //
  //////////////////////////////////////////////////////////////////////////
  showConfirmPopup(options: NgConfirmPopupOptions): Promise<boolean> {
    if (!document.body.contains((this.confirmPopupCmpRef?.hostView as EmbeddedViewRef<any>)?.rootNodes[0])) {
      this.confirmPopupCmpRef = this.addComponentToBody(ConfirmPopupComponent);
    }
    Object.assign(this.confirmPopupCmpRef.instance.options, options);
    return new Promise((accept, reject) => {
      this.confirmationService.confirm({
        target: options.target,
        message: options.message,
        icon: options.icon,
        accept: () => {
          this.removeComponentFromBody(this.confirmPopupCmpRef);
          accept(true);
        },
        reject: () => {
          this.removeComponentFromBody(this.confirmPopupCmpRef);
          accept(false);
        }
      });
    });
  }

  showConfirm(options: NgConfirmOptions): Promise<boolean> {
    if (!document.body.contains((this.confirmCmpRef?.hostView as EmbeddedViewRef<any>)?.rootNodes[0])) {
      this.confirmCmpRef = this.addComponentToBody(ConfirmComponent);
    }
    Object.assign(this.confirmCmpRef.instance.options, options);
    return new Promise((accept, reject) => {
      this.confirmationService.confirm({
        key: options.key,
        header: options.header,
        message: options.message,
        icon: options.icon,
        blockScroll: options.blockScroll,
        defaultFocus: options.defaultFocus,
        accept: (data) => {
          this.removeComponentFromBody(this.confirmCmpRef);
          accept(true);
        },
        reject: (data) => {
          this.removeComponentFromBody(this.confirmCmpRef);
          if (data == 2) {
            accept(null);
          } else if (data == 1) {
            accept(false);
          }
        }
      });
    });
  }

  //////////////////////////////////////////////////////////////////////////
  //                              DIALOG                                  //
  //////////////////////////////////////////////////////////////////////////
  showDialog(options: NgDialog): Promise<void> {
    if (!document.body.contains((this.dialogCmpRef?.hostView as EmbeddedViewRef<any>)?.rootNodes[0])) {
      this.dialogCmpRef = this.addComponentToBody(DialogComponent);
    }
    Object.assign(this.dialogCmpRef.instance.options, options);
    this.dialogCmpRef.instance.visible = true;
    return new Promise((accept, reject) => {
      this.dialogCmpRef.instance.onHide.subscribe(res => {
        this.removeComponentFromBody(this.dialogCmpRef);
        accept();
      });
    });
  }

  showDialogForm(
    header: string,
    config: NgDialogFormConfig[],
    options?: NgDialogFormOptions
  ): DynamicDialogRef {
    return this.dialogService.open(DialogFormComponent, {
      header,
      data: {config, options},
      width: options?.width || '600px',
      styleClass: options?.rtl ? 'rtl' : 'ltr',
      footer: options?.footer,
      height: options?.height,
      closeOnEscape: options?.closeOnEscape || true,
      dismissableMask: options?.dismissableMask || true,
      closable: options?.closable || true,
      showHeader: options?.showHeader || true,
      baseZIndex: 2000000
    });
  }

  //////////////////////////////////////////////////////////////////////////
  //                               FILTER                                 //
  //////////////////////////////////////////////////////////////////////////
  startsWith(value: any, filter: any) {
    return this.filterService.filters.startsWith(value, filter);
  }

  contains(value: any, filter: any) {
    return this.filterService.filters.contains(value, filter);
  }

  endsWith(value: any, filter: any) {
    return this.filterService.filters.endsWith(value, filter);
  }

  equals(value: any, filter: any) {
    return this.filterService.filters.equals(value, filter);
  }

  notEquals(value: any, filter: any) {
    return this.filterService.filters.notEquals(value, filter);
  }

  in(value: any, filter: any) {
    return this.filterService.filters.in(value, filter);
  }

  lt(value: any, filter: any) {
    return this.filterService.filters.lt(value, filter);
  }

  lte(value: any, filter: any) {
    return this.filterService.filters.lte(value, filter);
  }

  gt(value: any, filter: any) {
    return this.filterService.filters.gt(value, filter);
  }

  gte(value: any, filter: any) {
    return this.filterService.filters.gte(value, filter);
  }

  is(value: any, filter: any) {
    return this.filterService.filters.is(value, filter);
  }

  isNot(value: any, filter: any) {
    return this.filterService.filters.isNot(value, filter);
  }

  before(value: any, filter: any) {
    return this.filterService.filters.before(value, filter);
  }

  checkConnectionState(callback: any) {
    const imageUrl = 'https://via.placeholder.com/2000x2000';
    const downloadSize = 4995374;
    let startTime;
    let endTime;
    const download = new Image();
    download.onload = () => {
      endTime = (new Date()).getTime();
      const duration = (endTime - startTime) / 1000;
      const bitsLoaded = downloadSize * 8;
      const speedBps = +(bitsLoaded / duration).toFixed(2);
      const speedKbps = +(speedBps / 1024).toFixed(2);
      const speedMbps = +(speedKbps / 1024).toFixed(2);
      callback(speedMbps);
    };
    startTime = (new Date()).getTime();
    const cacheBuster = '?nnn=' + startTime;
    download.src = imageUrl + cacheBuster;
  }

  checkOnlineState(): Observable<boolean> {
    return merge<boolean>(
      fromEvent(window, 'offline').pipe(map(() => false)),
      fromEvent(window, 'online').pipe(map(() => true)),
      new Observable((observer: Observer<boolean>) => {
        observer.next(navigator.onLine);
        observer.complete();
      })
    );
  }

  addComponentToBody<T>(component: Type<T>, pos: 'appendChild' | 'prepend' = 'appendChild'): ComponentRef<T> {
    const factory = this.resolver.resolveComponentFactory(component);
    const componentRef = factory.create(this.injector);
    this.appRef.attachView(componentRef.hostView);
    const domElem = (componentRef.hostView as EmbeddedViewRef<any>).rootNodes[0] as HTMLElement;
    document.body[pos](domElem);
    return componentRef;
  }

  private removeComponentFromBody<T>(componentRef: ComponentRef<T>): void {
    this.appRef.detachView(componentRef.hostView);
    componentRef.destroy();
  }

  convertToTimeFormat(duration: number) {
    const hrs = Math.floor((duration / 3600));
    const mins = Math.floor(((duration % 3600) / 60));
    const secs = Math.floor(duration % 60);
    let result = '';
    if (hrs > 0) {
      result += '' + hrs + ':' + (mins < 10 ? '0' : '');
    }
    result += '' + mins + ':' + (secs < 10 ? '0' : '');
    result += '' + secs;
    return result;
  }

  disableWindowBackButton() {
    history.pushState(null, null, location.href);
    this.location.onPopState(() => {
      history.pushState(null, null, location.href);
    });
  }
}
