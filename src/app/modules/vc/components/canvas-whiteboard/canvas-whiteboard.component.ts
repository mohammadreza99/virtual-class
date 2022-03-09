import {Component, ElementRef, OnInit, Renderer2} from '@angular/core';
import {FormatType, formatTypes, NgWhiteboardService} from 'ng-whiteboard';
import {Subject} from 'rxjs';
import {SessionService} from '@core/http';
import {UpdateViewService} from '@core/http/update-view.service';
import {min, takeUntil} from 'rxjs/operators';

@Component({
  selector: 'ng-canvas-whiteboard',
  templateUrl: './canvas-whiteboard.component.html',
  styleUrls: ['./canvas-whiteboard.component.scss'],
})
export class CanvasWhiteboardComponent implements OnInit {
  color = '#333333';
  backgroundColor = '#eee';
  size = '5px';
  isSizeActive = false;
  isSaveActive = false;
  formatType = FormatType;
  destroy$: Subject<boolean> = new Subject<boolean>();
  currentPresentationId: any;
  currentImageUrl: string;
  currentPage: number = 1;
  pages: { [x: number]: string };
  disableNextBtn: boolean;
  disablePrevBtn: boolean;
  originalFileUrl: string;

  constructor(private whiteboardService: NgWhiteboardService,
              private sessionService: SessionService,
              private updateViewService: UpdateViewService,
              private elementRef: ElementRef,
              private renderer: Renderer2) {
  }

  ngOnInit() {
    this.updateViewService.getViewEvent().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      switch (res.event) {
        case 'changePresentationPage':
          this.currentPage = res.data.page_number;
          this.currentImageUrl = this.pages[this.currentPage];
          this.handleButtonsState();
          break;

        case 'openPresentation':
          this.addClass('open-presentation');
          this.currentPresentationId = res.data.presentation_id;
          this.pages = res.data.pages;
          this.currentPage = res.data.active_page;
          this.originalFileUrl = res.data.file_url;
          this.currentImageUrl = this.pages[this.currentPage];
          this.handleButtonsState();
          break;

        case 'closePresentation':
          this.removeClass('open-presentation');
          this.currentImageUrl = null;
          this.currentPresentationId = null;
          this.currentPage = null;
          this.pages = null;
          break;

        case 'deletePresentation':
          break;
      }
    });
  }

  onInit() {
  }

  onClear() {
  }

  onUndo() {
  }

  onRedo() {
  }

  onSave(img: string) {
    // Copy to clipboard
    const cb = navigator.clipboard;
    if (cb) {
      cb.writeText(img);
    }
  }

  onImageAded() {
  }

  erase() {
    this.whiteboardService.erase();
  }

  setSize(size) {
    this.size = size;
    this.isSizeActive = false;
  }

  save(type: formatTypes) {
    this.whiteboardService.save(type);
    this.isSaveActive = false;
  }

  undo() {
    this.whiteboardService.undo();
  }

  redo() {
    this.whiteboardService.redo();
  }

  addImage(fileInput) {
    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onloadend = () => {
      this.whiteboardService.addImage(reader.result);
      fileInput.value = '';
    };

    if (file) {
      reader.readAsDataURL(file);
    }
  }

  private addClass(className: string) {
    this.renderer.addClass(this.elementRef.nativeElement, className);
  }

  private removeClass(className: string) {
    this.renderer.removeClass(this.elementRef.nativeElement, className);
  }

  async nextPage() {
    this.currentPage++;
    await this.sessionService.changePresentationPage(this.currentPresentationId, this.currentPage).toPromise();
  }

  async prevPage() {
    this.currentPage--;
    await this.sessionService.changePresentationPage(this.currentPresentationId, this.currentPage).toPromise();
  }

  toggleFullScreen(element) {
    const requestMethod = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || element.msRequestFullScreen;

    if (requestMethod) {
      requestMethod.call(element);
    }
  }


  handleButtonsState() {
    const pages = Object.keys(this.pages).map(k => +k);
    const maxPage = Math.max(...pages);
    const minPage = Math.min(...pages);
    this.disableNextBtn = maxPage == 1 || this.currentPage == maxPage;
    this.disablePrevBtn = maxPage == 1 || this.currentPage == minPage;
  }

  closePresentation() {
    this.sessionService.changePresentationState(this.currentPresentationId, 'Close').toPromise();
  }

  downloadFile() {
    const a = document.createElement('a');
    a.href = this.originalFileUrl;
    a.target = '_blank';
    a.download = this.originalFileUrl.split('/').pop();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
