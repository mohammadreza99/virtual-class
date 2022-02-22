import {Component} from '@angular/core';
import {FormatType, formatTypes, NgWhiteboardService} from 'ng-whiteboard';

@Component({
  selector: 'ng-canvas-whiteboard',
  templateUrl: './canvas-whiteboard.component.html',
  styleUrls: ['./canvas-whiteboard.component.scss'],
})
export class CanvasWhiteboardComponent {
  color = '#333333';
  backgroundColor = '#eee';
  size = '5px';
  isSizeActive = false;
  isSaveActive = false;
  formatType = FormatType;

  constructor(private whiteboardService: NgWhiteboardService) {
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

}
