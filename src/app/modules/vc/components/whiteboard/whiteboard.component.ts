import {Component, OnInit, ViewChild} from '@angular/core';
import {
  availableColors,
  availableTextSizes, availableThicknesses, Colors, KonvaOptions, KonvaTools, OverlayMode, TextSizes, Thicknesses
} from '@core/models';
import {OverlayPanel} from 'primeng/overlaypanel';
import {KonvaService} from '@core/utils';

@Component({
  selector: 'ng-whiteboard',
  templateUrl: './whiteboard.component.html',
  styleUrls: ['./whiteboard.component.scss']
})
export class WhiteboardComponent implements OnInit {
  menuItems = [
    {
      label: 'Save as image', icon: 'pi pi-fw pi-plus', command: () => {
        this.saveAsImage();
      }
    },
  ];
  selectedTool: KonvaTools = 'select';
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
  @ViewChild(OverlayPanel, {static: true}) overlayPanel: OverlayPanel;

  constructor(private konvaService: KonvaService) {
  }

  pc1;
  pc2;

  canvas: any;
  video: any;

  ngOnInit(): void {
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
  }

  showOverlay(type: OverlayMode, event: any) {
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
