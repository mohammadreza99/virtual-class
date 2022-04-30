import {Component, ElementRef, OnInit, Renderer2, ViewChild} from '@angular/core';
import {
  availableColors,
  availableTextSizes, availableThicknesses, Colors, KonvaOptions, KonvaTools, OverlayMode, TextSizes, Thicknesses
} from '@core/models';
import {OverlayPanel} from 'primeng/overlaypanel';
import {KonvaService} from '@core/utils';
import {takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {SessionService} from '@core/http';
import {UpdateViewService} from '@core/http/update-view.service';

@Component({
  selector: 'ng-whiteboard',
  templateUrl: './whiteboard.component.html',
  styleUrls: ['./whiteboard.component.scss'],
})
export class WhiteboardComponent implements OnInit {
  selectedTool: KonvaTools;
  selectedOption: KonvaOptions = {
    color: '#000000',
    thickness: 4,
    textSize: 16
  };
  overlayMode: OverlayMode;
  availableThickness = availableThicknesses;
  availableColors = availableColors;
  availableTextSizes = availableTextSizes;
  slidesCount: number = 10;
  currentSlide: number = 0;
  destroy$: Subject<boolean> = new Subject<boolean>();
  presentationData: any;
  currentImageUrl: string;
  disableNextBtn: boolean;
  disablePrevBtn: boolean;
  fullscreenEnabled: boolean = false;

  constructor(private sessionService: SessionService,
              private updateViewService: UpdateViewService,
              private elementRef: ElementRef,
              private konvaService: KonvaService,
              private renderer: Renderer2) {
  }

  @ViewChild(OverlayPanel, {static: true}) overlayPanel: OverlayPanel;


  ngOnInit() {
    this.konvaService.start(this.slidesCount, this.currentSlide);
    this.konvaService.stageChange().subscribe(res => {
      switch (res.event) {
        case 'toolChange':
          this.selectedTool = res.tool;
          break;
        case 'optionChange':
          break;
      }
    });

    this.updateViewService.getViewEvent().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      switch (res.event) {
        case 'changePresentationPage':
          this.presentationData.active_page = res.data.page_number;
          this.currentImageUrl = this.presentationData.pages[res.data.page_number];
          this.handleButtonsState();
          break;

        case 'openPresentation':
          this.addClass('active');
          this.presentationData = res.data;
          this.currentImageUrl = this.presentationData.pages[res.data.active_page];
          this.handleButtonsState();
          break;

        case 'closePresentation':
          this.removeClass('active');
          this.presentationData = null;
          this.currentImageUrl = null;
          break;

        case 'deletePresentation':
          break;
      }
    });
  }

  private addClass(className: string) {
    this.renderer.addClass(this.elementRef.nativeElement, className);
  }

  private removeClass(className: string) {
    this.renderer.removeClass(this.elementRef.nativeElement, className);
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


  showOptionOverlay(type: OverlayMode, event: any) {
    this.overlayMode = type;
    this.overlayPanel.toggle(event);
  }

  onSelectTool(tool: KonvaTools) {
    this.selectedTool = tool;
    this.konvaService.setTool(tool);
    this.overlayPanel?.hide();
  }

  onSelectImage(event: any) {
    if (event.target.files) {
      this.konvaService.image(event.target.files[0]);
    }
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

  nextSlide() {
    this.currentSlide++;
    this.konvaService.goToSlide(this.currentSlide);
  }

  prevSlide() {
    this.currentSlide--;
    this.konvaService.goToSlide(this.currentSlide);
  }
}
