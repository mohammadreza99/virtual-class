import {Component, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild} from '@angular/core';
import {
  availableColors,
  availableTextSizes,
  availableThicknesses,
  Colors,
  KonvaOptions,
  KonvaTools,
  OverlayMode,
  TextSizes,
  Thicknesses
} from '@core/models';
import {OverlayPanel} from 'primeng/overlaypanel';
import {KonvaService, UpdateViewService} from '@core/utils';
import {takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {SessionService} from '@core/http';
import {UtilsService} from '@ng/services';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {DialogService} from 'primeng/dynamicdialog';
import {WhiteboardManagePermissionComponent} from '@modules/vc/components/whiteboard-manage-permission-form/whiteboard-manage-permission.component';

@Component({
  selector: 'ng-whiteboard',
  templateUrl: './whiteboard.component.html',
  styleUrls: ['./whiteboard.component.scss'],
})
export class WhiteboardComponent extends LanguageChecker implements OnInit, OnDestroy {
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
  hasPermission: boolean;

  constructor(private sessionService: SessionService,
              private updateViewService: UpdateViewService,
              private elementRef: ElementRef,
              private konvaService: KonvaService,
              private dialogService: DialogService,
              private renderer: Renderer2) {
    super();
  }

  @ViewChild(OverlayPanel, {static: true}) overlayPanel: OverlayPanel;

  ngOnInit() {
    this.hasPermission = this.sessionService.imTeacher;
    this.konvaService.stageChange().pipe(takeUntil(this.destroy$)).subscribe(res => {
      switch (res.event) {
        case 'updateBoard':
          if (!this.selectedTool) {
            return;
          }
          this.sessionService.updateBoard(this.whiteboardData.board_id, this.currentSlide, res.data).toPromise();
          break;

        case 'toolChange':
          this.selectedTool = res.tool;
          break;

        case 'optionChange':
          break;
      }
    });

    this.updateViewService.getViewEvent().pipe(takeUntil(this.destroy$)).subscribe(async (res: any) => {
      switch (res.event) {
        case 'openBoard':
          this.activateBoard();
          this.whiteboardData = res.data;
          this.currentSlide = res.data.current_slide_no || 1;
          if (this.whiteboardData.slides?.length) {
            const slidesData = Array.from({length: 10}, (s, i) => ({data: null, slideNumber: i + 1}));
            this.whiteboardData.slides.forEach(slide => {
              const idx = slidesData.findIndex(s => slide.slide_no == s.slideNumber);
              slidesData[idx] = {data: slide.data, slideNumber: slide.slide_no};
            });
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
          if (res.data.user_id == this.sessionService.currentUser.id) {
            this.hasPermission = true;
          }
          break;

        case 'removeBoardPermission':
          if (res.data.user_id == this.sessionService.currentUser.id) {
            this.hasPermission = false;
          }
          break;

        case 'changePresentationPage':
          // this.currentSlide = res.data.page_number;
          // this.presentationCurrentSlide = this.presentationData.pages[this.currentSlide];
          // this.konvaService.goToSlide(this.currentSlide);
          // this.konvaService.image(this.presentationCurrentSlide);
          // this.konvaService.clearBoard();
          // this.handleButtonsState();
          break;

        case 'openPresentation':
          if (res.data.is_video) {
            return;
          }
          this.activateBoard();
          this.presentationData = res.data;
          this.currentSlide = res.data.active_page;
          await this.sessionService.openBoard(false).toPromise();
          this.slidesCount = Object.keys(this.presentationData.pages).length;
          const entries = Object.entries(this.presentationData.pages);
          this.konvaService.start(entries.length);
          for (const [key, value] of entries) {
            this.konvaService.goToSlide(+key);
            await this.konvaService.image(value);
          }
          this.konvaService.goToSlide(this.currentSlide);
          // this.presentationCurrentSlide = this.presentationData.pages[this.currentSlide];
          this.handleButtonsState();
          break;

        case 'closePresentation':
          if (res.data.is_video) {
            return;
          }
          this.deactivateBoard();
          this.presentationData = null;
          this.presentationCurrentSlide = null;
          break;

        case 'deletePresentation':
          break;
      }
    });
  }

  async nextPage(callback: any) {
    try {
      this.currentSlide++;
      if (this.presentationData) {
        // await this.sessionService.changePresentationPage(this.presentationData.presentation_id, this.currentSlide).toPromise();
        await this.sessionService.changeBoardSlide(this.whiteboardData.board_id, this.currentSlide).toPromise();
      } else if (this.whiteboardData) {
        await this.sessionService.changeBoardSlide(this.whiteboardData.board_id, this.currentSlide).toPromise();
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
        // await this.sessionService.changePresentationPage(this.presentationData.presentation_id, this.currentSlide).toPromise();
        await this.sessionService.changeBoardSlide(this.whiteboardData.board_id, this.currentSlide).toPromise();
      } else if (this.whiteboardData) {
        await this.sessionService.changeBoardSlide(this.whiteboardData.board_id, this.currentSlide).toPromise();
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
    // if (this.whiteboardData) {
    //   this.sessionService.closeBoard().toPromise();
    // } else if (this.presentationData) {
    //   this.sessionService.changePresentationState(this.presentationData.presentation_id, 'Close').toPromise();
    // }
    if (this.presentationData) {
      this.sessionService.changePresentationState(this.presentationData.presentation_id, 'Close').toPromise();
      this.sessionService.closeBoard().toPromise();
    } else if (this.whiteboardData) {
      this.sessionService.closeBoard().toPromise();
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
      line: 'icon-fi-rr-minus',
      rectangle: 'icon-fi-rr-rectangle-horizontal',
      select: 'icon-fi-rr-cursor',
      text: 'icon-fi-rr-text',
      triangle: 'icon-fi-rr-pyramid',
    };
    // if (['eraser', 'select'].indexOf(this.selectedTool) > -1) {
    //   return;
    // }
    return source[this.selectedTool];
  }

  async setPermissionForUser() {
    const users = this.sessionService.getRoomUsers().filter(u => u.id != this.sessionService.currentUser.id);
    const res = await this.sessionService.boardPermission(this.whiteboardData.board_id).toPromise();
    let allowedUsers;
    if (res.status == 'OK') {
      allowedUsers = res.data.users;
    }
    this.dialogService.open(WhiteboardManagePermissionComponent, {
      header: this.instant('room.whiteboardPermission'),
      data: {users, allowedUsers},
      width: '500px'
    }).onClose.subscribe(res => {
      if (!res) {
        return;
      }
      if (res.selectedUsers.length) {
        this.sessionService.setBoardPermission(this.whiteboardData.board_id, res.selectedUsers).toPromise();
      }
      if (res.unselectedUsers.length) {
        this.sessionService.removeBoardPermission(this.whiteboardData.board_id, res.unselectedUsers).toPromise();
      }
    });
  }
}
