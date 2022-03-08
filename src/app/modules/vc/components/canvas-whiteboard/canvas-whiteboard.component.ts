import {Component, ElementRef, OnInit, Renderer2} from '@angular/core';
import {FormatType, formatTypes, NgWhiteboardService} from 'ng-whiteboard';
import {Subject} from 'rxjs';
import {SessionService} from '@core/http';
import {UpdateViewService} from '@core/http/update-view.service';
import {takeUntil} from 'rxjs/operators';

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
  imageUrl: string;

  constructor(private whiteboardService: NgWhiteboardService,
              private sessionService: SessionService,
              private updateViewService: UpdateViewService,
              private elementRef: ElementRef,
              private renderer: Renderer2,) {
  }

  ngOnInit() {
    this.updateViewService.getViewEvent().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      switch (res.event) {
        case 'changePresentationPage':
          break;

        case 'openPresentation':
          this.imageUrl = res.data.file_url;
          this.addClass('open-presentation');
          break;

        case 'closePresentation':
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

}
