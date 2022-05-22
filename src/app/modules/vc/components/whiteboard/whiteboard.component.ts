import {Component, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild} from '@angular/core';
import {
  availableColors,
  availableTextSizes, availableThicknesses, Colors, KonvaOptions, KonvaTools, OverlayMode, TextSizes, Thicknesses
} from '@core/models';
import {OverlayPanel} from 'primeng/overlaypanel';
import {KonvaService} from '@core/utils';
import {takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {SessionService} from '@core/http';
import {UpdateViewService} from '@core/utils';

@Component({
  selector: 'ng-whiteboard',
  templateUrl: './whiteboard.component.html',
  styleUrls: ['./whiteboard.component.scss'],
})
export class WhiteboardComponent implements OnInit, OnDestroy {
  whiteboardData: any;
  selectedTool: KonvaTools;
  selectedOption: KonvaOptions = {
    color: '#000000',
    thickness: 4,
    textSize: 16
  };
  whiteboardOverlayMode: OverlayMode;
  availableThickness = availableThicknesses;
  availableColors = availableColors;
  availableTextSizes = availableTextSizes;

  presentationData: any;
  presentationCurrentSlide: string;
  disableNextBtn: boolean;
  disablePrevBtn: boolean;

  currentSlide: number = 1;
  slidesCount: number = 10;
  destroy$: Subject<boolean> = new Subject<boolean>();
  fullscreenEnabled: boolean = false;

  constructor(private sessionService: SessionService,
              private updateViewService: UpdateViewService,
              private elementRef: ElementRef,
              private konvaService: KonvaService,
              private renderer: Renderer2) {
  }

  @ViewChild(OverlayPanel, {static: true}) overlayPanel: OverlayPanel;

  ngOnInit() {
    this.konvaService.stageChange().pipe(takeUntil(this.destroy$)).subscribe(res => {
      switch (res.event) {
        case 'updateBoard':
          if (!this.selectedTool) {
            return;
          }
          this.sessionService.updateBoard(this.whiteboardData.id, this.currentSlide, res.data).toPromise();
          break;

        case 'toolChange':
          this.selectedTool = res.tool;
          break;
        case 'optionChange':
          break;
      }
    });

    this.updateViewService.getViewEvent().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      switch (res.event) {
        case 'openBoard':
          this.activateBoard();
          this.whiteboardData = res.data;
          this.currentSlide = res.data.current_slide_no || 1;
          if (this.whiteboardData.slides?.length) {
            const slidesData = this.whiteboardData.slides.map(s => ({data: s.data, slideNumber: s.slide_no}));
            this.konvaService.start(slidesData);
          } else {
            this.konvaService.start();
          }
          this.konvaService.goToSlide(this.currentSlide);
          this.handleButtonsState();
          if (this.sessionService.imStudent) {
            this.onSelectTool(null);
          }
          break;

        case 'closeBoard':
          this.konvaService.destroyBoard();
          this.deactivateBoard();
          this.whiteboardData = null;
          this.currentSlide = null;
          break;

        case 'updateBoard':
          if (res.data.by == this.sessionService.currentUser.id) {
            return;
          }
          this.konvaService.updateBoard(res.data.data, this.currentSlide);
          break;

        case 'changeBoardSlide':
          this.currentSlide = res.data.slide_no;
          this.konvaService.goToSlide(this.currentSlide);
          break;

        case 'setBoardPermission':

          break;

        case 'removeBoardPermission':

          break;

        // case 'changePresentationPage':
        //   this.currentSlide = res.data.page_number;
        //   this.presentationCurrentSlide = this.presentationData.pages[this.currentSlide];
        //   this.handleButtonsState();
        //   break;

        // case 'openPresentation':
        //   this.activateBoard();
        //   this.presentationData = res.data;
        //   this.currentSlide = res.data.active_page;
        //   this.slidesCount = Object.keys(this.presentationData.pages).length;
        //   this.presentationCurrentSlide = this.presentationData.pages[this.currentSlide];
        //   this.handleButtonsState();
        //   break;
        //
        // case 'closePresentation':
        //   this.deactivateBoard();
        //   this.presentationData = null;
        //   this.presentationCurrentSlide = null;
        //   break;
        //
        // case 'deletePresentation':
        //   break;
      }
    });
  }

  async nextPage(callback: any) {
    try {
      this.currentSlide++;
      if (this.presentationData) {
        await this.sessionService.changePresentationPage(this.presentationData.presentation_id, this.currentSlide).toPromise();
      } else if (this.whiteboardData) {
        await this.sessionService.changeBoardSlide(this.whiteboardData.id, this.currentSlide).toPromise();
        this.konvaService.goToSlide(this.currentSlide);
      }
      this.handleButtonsState();
      callback();
    } catch (e) {
      callback();
    }
  }

  async prevPage(callback: any) {
    try {
      this.currentSlide--;
      if (this.presentationData) {
        await this.sessionService.changePresentationPage(this.presentationData.presentation_id, this.currentSlide).toPromise();
      } else if (this.whiteboardData) {
        await this.sessionService.changeBoardSlide(this.whiteboardData.id, this.currentSlide).toPromise();
        this.konvaService.goToSlide(this.currentSlide);
      }
      this.handleButtonsState();
      callback();
    } catch (e) {
      callback();
    }
  }

  handleButtonsState() {
    const pages = Array.from({length: this.slidesCount}, (_, i) => i + 1);
    const maxPage = Math.max(...pages);
    const minPage = Math.min(...pages);
    this.disableNextBtn = maxPage == 1 || this.currentSlide == maxPage;
    this.disablePrevBtn = maxPage == 1 || this.currentSlide == minPage;
  }

  showOptionOverlay(type: OverlayMode, event: any) {
    this.whiteboardOverlayMode = type;
    this.overlayPanel.toggle(event);
  }

  onSelectTool(tool: KonvaTools) {
    this.selectedTool = tool;
    this.konvaService.setTool(tool);
    this.overlayPanel?.hide();
  }

  onSelectColor(color: Colors) {
    this.konvaService.setOption({color});
    this.selectedOption.color = color;
    this.overlayPanel.hide();
  }

  onSelectTextSize(textSize: TextSizes) {
    this.konvaService.setOption({textSize});
    this.selectedOption.textSize = textSize;
    this.overlayPanel.hide();
  }

  onSelectThickness(thickness: Thicknesses) {
    this.konvaService.setOption({thickness});
    this.selectedOption.thickness = thickness;
    this.overlayPanel.hide();
  }

  undo(): void {
    this.konvaService.undo();
  }

  clearBoard(): void {
    this.konvaService.clearBoard();
  }

  saveAsImage(): void {
    this.konvaService.saveAsImage();
  }

  ///////////////////////////////// COMMON //////////////////////////////////

  activateBoard() {
    this.renderer.addClass(this.elementRef.nativeElement, 'active');
  }

  deactivateBoard() {
    this.renderer.removeClass(this.elementRef.nativeElement, 'active');
  }

  close() {
    if (this.whiteboardData) {
      this.sessionService.closeBoard().toPromise();
    } else if (this.presentationData) {
      this.sessionService.changePresentationState(this.presentationData.presentation_id, 'Close').toPromise();
    }
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

  openFullscreen(elem: any) {
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

  toggleFullScreen(element: any) {
    if (this.fullscreenEnabled) {
      this.closeFullscreen();
    } else {
      this.openFullscreen(element);
    }
    this.fullscreenEnabled = !this.fullscreenEnabled;
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  getActiveToolIcon() {
    const source = {
      brush: 'icon-fi-rr-pencil',
      circle: 'icon-fi-rr-rec',
      eraser: 'icon-erase',
      image: 'icon-fi-rr-mode-landscape',
      line: 'icon-fi-rr-minus',
      rectangle: 'icon-fi-rr-rectangle-horizontal',
      select: 'icon-fi-rr-cursor',
      text: 'icon-fi-rr-text',
      triangle: 'icon-fi-rr-pyramid',
    };
    return source[this.selectedTool];
  }
}
