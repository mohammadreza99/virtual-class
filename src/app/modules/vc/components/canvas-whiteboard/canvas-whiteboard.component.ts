import {Component, ElementRef, OnInit, Renderer2} from '@angular/core';
import {Subject} from 'rxjs';
import {SessionService} from '@core/http';
import {UpdateViewService} from '@core/utils';
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
  destroy$: Subject<boolean> = new Subject<boolean>();
  presentationData: any;
  currentImageUrl: string;
  disableNextBtn: boolean;
  disablePrevBtn: boolean;
  fullscreenEnabled: boolean = false;

  constructor(private sessionService: SessionService,
              private updateViewService: UpdateViewService,
              private elementRef: ElementRef,
              private renderer: Renderer2) {
  }

  ngOnInit() {
    this.updateViewService.getViewEvent().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      switch (res.event) {
        case 'changePresentationPage':
          this.presentationData.active_page = res.data.page_number;
          this.currentImageUrl = this.presentationData.pages[res.data.page_number];
          this.handleButtonsState();
          break;

        case 'openPresentation':
          this.activatePresentation();
          this.presentationData = res.data;
          this.currentImageUrl = this.presentationData.pages[res.data.active_page];
          this.handleButtonsState();
          break;

        case 'closePresentation':
          this.deactivatePresentation();
          this.presentationData = null;
          this.currentImageUrl = null;
          break;

        case 'deletePresentation':
          break;
      }
    });
  }

  private activatePresentation() {
    this.renderer.addClass(this.elementRef.nativeElement, 'active');
  }

  private deactivatePresentation() {
    this.renderer.removeClass(this.elementRef.nativeElement, 'active');
  }

  async nextPage(callback: any) {
    try {
      this.presentationData.active_page++;
      await this.sessionService.changePresentationPage(this.presentationData.presentation_id, this.presentationData.active_page).toPromise();
      callback();
    } catch (e) {
      callback();
    }
  }

  async prevPage(callback: any) {
    try {
      this.presentationData.active_page--;
      await this.sessionService.changePresentationPage(this.presentationData.presentation_id, this.presentationData.active_page).toPromise();
      callback();
    } catch (e) {
      callback();
    }
  }

  openFullscreen(elem) {
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  }

  closeFullscreen() {
    const doc = document as any;
    if (doc.exitFullscreen) {
      doc.exitFullscreen();
    } else if (doc.webkitExitFullscreen) {
      doc.webkitExitFullscreen();
    } else if (doc.msExitFullscreen) {
      doc.msExitFullscreen();
    }
  }

  toggleFullScreen(element) {
    if (this.fullscreenEnabled) {
      this.closeFullscreen();
    } else {
      this.openFullscreen(element);
    }
    this.fullscreenEnabled = !this.fullscreenEnabled;
  }


  handleButtonsState() {
    const pages = Object.keys(this.presentationData.pages).map(k => +k);
    const maxPage = Math.max(...pages);
    const minPage = Math.min(...pages);
    this.disableNextBtn = maxPage == 1 || this.presentationData.active_page == maxPage;
    this.disablePrevBtn = maxPage == 1 || this.presentationData.active_page == minPage;
  }

  closePresentation() {
    this.sessionService.changePresentationState(this.presentationData.presentation_id, 'Close').toPromise();
  }

  downloadFile() {
    const a = document.createElement('a');
    a.href = this.presentationData.file_url;
    a.target = '_blank';
    a.download = this.presentationData.file_url.split('/').pop();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

}
