import {Inject, Injectable} from '@angular/core';
import {Layer} from 'konva/lib/Layer';
import {Image as KonvaImage} from 'konva/lib/shapes/Image';
import {Line} from 'konva/lib/shapes/Line';
import {Text} from 'konva/lib/shapes/Text';
import {Transformer} from 'konva/lib/shapes/Transformer';
import {Subject} from 'rxjs';
import {Rect} from 'konva/lib/shapes/Rect';
import {Circle} from 'konva/lib/shapes/Circle';
import {RegularPolygon} from 'konva/lib/shapes/RegularPolygon';
import {jsPDF} from 'jspdf';
import {KonvaOptions, KonvaTools, CanvasItem, StageEvents, WhiteboardSlide} from '@core/models';
import {Stage} from 'konva/lib/Stage';
import Konva from 'konva';
import {KonvaEventObject} from 'konva/lib/Node';
import {DOCUMENT} from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class KonvaService {

  constructor(@Inject(DOCUMENT) private _document: Document) {
  }

  private boardActivated: boolean = false;
  private stageChangeSubject = new Subject<{ event: StageEvents, [key: string]: any }>();
  private selectedTool: KonvaTools = 'brush';
  private selectedOptions: KonvaOptions = {
    thickness: 4,
    color: '#000000',
    textSize: 16
  };
  private slides: CanvasItem[] = [];
  private currentSlide: CanvasItem = {
    stage: null,
    layer: null,
    shapes: []
  };

  start(slides: WhiteboardSlide[] | number = 10, initSlideNumber: number = 1) {
    if (this.boardActivated) {
      return;
    }
    if (typeof slides == 'number') {
      slides = Array.from({length: slides}, (s, i) => ({data: null, slideNumber: i + 1}));
    }
    for (const slide of slides) {
      const containerEl = this._document.createElement('div');
      const id = this.getId(slide.slideNumber);
      containerEl.id = id;
      containerEl.style.height = '100%';
      this.boardContainerEl.appendChild(containerEl);
      this.init(id, slide.data);
    }
    this.goToSlide(initSlideNumber);
    this.setTool(this.selectedTool);
    this.boardActivated = true;
  }

  private createStage(id: string) {
    return new Stage({
      container: id,
      width: 1000,
      height: 1000
    });
  }

  private init(id: string, data: any = null) {
    let stage: Stage;
    const layer = new Layer();
    if (data) {
      stage = Konva.Node.create(data, id);
    } else {
      stage = this.createStage(id);
    }
    stage.add(layer);

    const slideIdx = this.slides.findIndex(slide => slide.stage.container().id == stage.container().id);
    if (slideIdx == -1) {
      this.slides.push({stage, layer, shapes: []});
    } else {
      this.slides[slideIdx].stage = stage;
      this.slides[slideIdx].layer = layer;
    }

    let shape: any;
    let isPaint: boolean = false;
    let sourcePoints: { x: number, y: number };

    stage.on('mousedown touchstart', (e: KonvaEventObject<any>) => {
      const emptySpace = e.target === e.target.getStage();
      if (emptySpace) {
        const shapes = stage.find('.transformer');
        shapes.forEach(sh => {
          sh.hide();
        });
      }
      sourcePoints = stage.getRelativePointerPosition();
      switch (this.selectedTool) {
        case 'text':
          this.text(sourcePoints);
          break;

        case 'brush':
        case 'rectangle':
        case 'circle':
        case 'triangle':
        case 'line':
        case 'eraser':
          isPaint = true;
          shape = this[this.selectedTool](sourcePoints);
          break;
      }
    });

    stage.on('mousemove touchmove', (e: KonvaEventObject<any>) => {
      if (!isPaint) {
        return;
      }
      const pos = stage.getRelativePointerPosition();
      if (this.selectedTool == 'brush' || this.selectedTool == 'eraser') {
        e.evt.preventDefault();
        const newPoints = shape.points().concat([pos.x, pos.y]);
        shape.points(newPoints);
        layer.batchDraw();
      }
      if (this.selectedTool == 'line') {
        const points = shape.points().slice();
        points[2] = pos.x;
        points[3] = pos.y;
        shape.points(points);
        layer.batchDraw();
      }
      if (this.selectedTool == 'rectangle') {
        shape.width(pos.x - sourcePoints.x);
        shape.height(pos.y - sourcePoints.y);
        layer.batchDraw();
      }
      if (this.selectedTool == 'circle') {
        const radius = pos.x - sourcePoints.x;
        shape.radius(Math.abs(radius));
        layer.batchDraw();
      }
      if (this.selectedTool == 'triangle') {
        const radius = pos.x - sourcePoints.x;
        shape.radius(Math.abs(radius));
        layer.batchDraw();
      }
    });

    stage.on('mouseup touchend', () => {
      this.stageChangeSubject.next({event: 'updateBoard', data: stage.toJSON()});
      isPaint = false;
    });

    this.fitStageIntoParentContainer(stage);
    window.addEventListener('resize', () => {
      this.fitStageIntoParentContainer(stage);
    });
  }

  fitStageIntoParentContainer = (stage: Stage) => {
    if (!this.boardActivated) {
      return;
    }
    if (!stage) {
      stage = this.currentSlide.stage;
    }
    const containerWidth = this.boardContainerEl.offsetWidth;
    const containerHeight = this.boardContainerEl.offsetHeight;
    stage.width(containerWidth);
    stage.height(containerHeight);
    stage.scale({x: containerWidth / 1000, y: containerHeight / 1000});
  };

  fitStageIntoParentContainer2 = () => {
    const containerWidth = this.boardContainerEl.offsetWidth;
    const scale = containerWidth / 1000;
    this.currentSlide.stage.width(1000 * scale);
    this.currentSlide.stage.height(1000 * scale);
    this.currentSlide.stage.scale({x: scale, y: scale});
  };

  private brush(pos: any) {
    const line = new Line({
      stroke: this.selectedOptions.color,
      strokeWidth: this.selectedOptions.thickness,
      globalCompositeOperation: 'source-over',
      points: [pos.x, pos.y, pos.x, pos.y],
      lineCap: 'round',
      lineJoin: 'round',
      tension: 0,
    });
    this.addToLayerAndShapes(line);
    return line;
  }

  private circle(pos: any) {
    const circle = new Circle({
      x: pos.x,
      y: pos.y,
      stroke: this.selectedOptions.color,
      strokeWidth: this.selectedOptions.thickness,
      draggable: false,
      strokeScaleEnabled: false,
    });
    this.addTransformer(circle);
    return circle;
  }

  private triangle(pos: any) {
    const triangle = new RegularPolygon({
      x: pos.x,
      y: pos.y,
      sides: 3,
      radius: 0,
      stroke: this.selectedOptions.color,
      strokeWidth: this.selectedOptions.thickness,
      draggable: false,
      strokeScaleEnabled: false,
    });
    this.addTransformer(triangle);
    return triangle;
  }

  private rectangle(pos: any) {
    const rect = new Rect({
      x: pos.x,
      y: pos.y,
      stroke: this.selectedOptions.color,
      strokeWidth: this.selectedOptions.thickness,
      draggable: false,
      strokeScaleEnabled: false,
    });
    this.addTransformer(rect);
    return rect;
  }

  private line(pos: any) {
    const line = new Line({
      points: [pos.x, pos.y, pos.x, pos.y],
      stroke: this.selectedOptions.color,
      strokeWidth: this.selectedOptions.thickness,
      listening: false,
    });
    this.addToLayerAndShapes(line);
    return line;
  }

  private eraser(pos: any) {
    const line = new Line({
      stroke: '#ffffff',
      strokeWidth: 30,
      globalCompositeOperation: 'destination-out',
      points: [pos.x, pos.y, pos.x, pos.y],
      lineCap: 'round',
      lineJoin: 'round'
    });
    this.addToLayerAndShapes(line);
    return line;
  }

  private text(pos: any) {
    const text = new Text({
      text: '',
      x: pos.x,
      y: pos.y,
      fill: this.selectedOptions.color,
      fontSize: this.selectedOptions.textSize,
      draggable: false,
      width: 200,
    });

    const tr = this.addTransformer(text, true, ['middle-left', 'middle-right']);

    const appendTextarea = () => {
      const textPosition = text.absolutePosition();
      const areaPosition = {
        x: `calc(70px + 1rem + ${textPosition.x}px)`,
        y: `calc(70px + 1rem + 48px + ${textPosition.y}px)`,
        // 70px => top navbar height
        // 1rem => container padding top
      };
      const textarea = this._document.createElement('textarea');
      let transform = '';
      text.hide();
      tr.show();
      this._document.body.appendChild(textarea);
      textarea.style.position = 'absolute';
      textarea.style.border = 'none';
      textarea.style.overflow = 'hidden';
      textarea.style.background = 'none';
      textarea.style.outline = 'none';
      textarea.style.resize = 'none';
      textarea.style.transformOrigin = 'left top';
      textarea.value = text.text();
      textarea.style.top = areaPosition.y;
      textarea.style.left = areaPosition.x;
      textarea.style.width = text.width() - text.padding() * 2 + 'px';
      textarea.style.height = text.height() - text.padding() * 2 + 5 + 'px';
      textarea.style.fontSize = text.fontSize() + 'px';
      textarea.style.lineHeight = text.lineHeight().toString();
      textarea.style.fontFamily = text.fontFamily();
      textarea.style.textAlign = text.align();
      textarea.style.color = text.fill();
      if (text.rotation()) {
        transform += 'rotateZ(' + text.rotation() + 'deg)';
      }
      const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      const isEdge = this._document.DOCUMENT_NODE || /Edge/.test(navigator.userAgent);
      if (isFirefox) {
        const px = 2 + Math.round(text.fontSize() / 20);
        transform += ' translateY(-' + px + 'px)';
      }
      textarea.style.transform = transform;
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 3 + 'px';
      setTimeout(() => {
        textarea.focus();
      }, 0);

      const setTextareaWidth = (newWidth: number) => {
        if (!newWidth) {
          newWidth = (text as any).placeholder.length * text.fontSize();
        }
        if (isSafari || isFirefox) {
          newWidth = Math.ceil(newWidth);
        }
        if (isEdge) {
          newWidth += 1;
        }
        textarea.style.width = newWidth + 'px';
      };

      textarea.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.keyCode === 27) {
          removeTextarea();
        }
        const scale = text.getAbsoluteScale().x;
        text.text(textarea.value);
        setTextareaWidth(text.width() * scale);
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + text.fontSize() + 'px';
        tr.forceUpdate();
      });

      const removeTextarea = () => {
        textarea.parentNode?.removeChild(textarea);
        this.currentSlide.stage.off('click', handleOutsideClick);
        text.show();
        tr.hide();
        tr.forceUpdate();
      };

      const handleOutsideClick = () => {
        text.text(textarea.value);
        removeTextarea();
      };

      this.currentSlide.stage.on('click tap', (e: any) => {
        handleOutsideClick();
      });
    };

    appendTextarea();

    text.on('transform', () => {
      text.setAttrs({
        width: text.width() * text.scaleX(),
        scaleX: 1,
      });
    });

    text.on('dblclick dbltap', (e) => {
      if (this.selectedTool != 'select') {
        return;
      }
      appendTextarea();
    });
  }

  image(file: File | string | unknown) {
    // return new Promise((resolve, reject) => {
    this.currentSlide.stage.container().style.backgroundImage = `url("${file}")`;
    this.currentSlide.stage.container().style.backgroundSize = 'contain';
    this.currentSlide.stage.container().style.backgroundRepeat = 'no-repeat';
    this.currentSlide.stage.container().style.backgroundPosition = 'center center';

    //   let url: any;
    //   if (typeof file != 'string') {
    //     const URL = window.webkitURL || window.URL;
    //     url = URL.createObjectURL(file);
    //   } else {
    //     url = file;
    //   }
    //   const img = new Image();
    //   img.onload = () => {
    //     const imgWidth = img.width;
    //     const imgHeight = img.height;
    //     const max = 300;
    //     const ratio = (imgWidth > imgHeight ? (imgWidth / max) : (imgHeight / max));
    //     const image = new KonvaImage({
    //       image: img,
    //       // x: (this.currentSlide.stage.width() / 2) - (imgWidth / ratio),
    //       // y: (this.currentSlide.stage.height() / 2) - (imgHeight / ratio),
    //       // width: imgWidth / ratio,
    //       // height: imgHeight / ratio,
    //       borderSize: 5,
    //       borderColor: 'red',
    //       draggable: false,
    //     });
    //     // this.addTransformer(image, true);
    //     this.addToLayerAndShapes(image);
    //     this.currentSlide.layer.draw();
    //     this.setTool('select');
    //     resolve(true);
    //   };
    //   img.src = url;
    // });
  }

  private addTransformer(shape: any, resetTool: boolean = false, anchors?: string[]) {
    const tr = new Transformer({
      node: shape as any,
      enabledAnchors: anchors,
      // ignore stroke in size calculations
      ignoreStroke: true,
      padding: 5,
      name: 'transformer'
    });

    tr.hide();
    shape.on('mousedown touchstart', (e) => {
      if (this.selectedTool != 'select') {
        shape.draggable(false);
        return;
      }
      tr.show();
      shape.opacity(0.5);
      shape.shadowOpacity(0.5);
      shape.shadowColor('black');
      shape.shadowBlur(10);
      shape.shadowOffset({x: 10, y: 10});
      shape.draggable(true);
    });
    shape.on('mouseup touchend dragend', (e) => {
      shape.opacity(1);
      shape.shadowOpacity(0);
      shape.shadowColor('transparent');
      shape.shadowBlur(0);
      shape.shadowOffset({x: 0, y: 0});
      this.stageChangeSubject.next({event: 'updateBoard', data: this.currentSlide.stage.toJSON()});
    });
    this.addToLayerAndShapes(shape);
    this.addToLayerAndShapes(tr);
    this.currentSlide.layer.draw();
    if (resetTool) {
      tr.show();
      this.setTool('select');
    }
    return tr;
  }

  private addToLayerAndShapes(item: any) {
    this.currentSlide.shapes.push(item);
    this.currentSlide.layer.add(item);
  }

  private getId(index: number) {
    return `slide${index}`;
  }

  undo() {
    const removed = this.currentSlide.shapes.pop();
    if (!removed) {
      return;
    }
    if (removed instanceof Transformer) {
      removed.detach();
      this.currentSlide.shapes.pop()?.remove();
    } else {
      removed.remove();
    }
    this.currentSlide.layer.draw();
    this.stageChangeSubject.next({event: 'updateBoard', data: this.currentSlide.stage.toJSON()});
  }

  clearBoard() {
    this.currentSlide.layer.destroyChildren();
    this.currentSlide.layer.draw();
    this.stageChangeSubject.next({event: 'updateBoard', data: this.currentSlide.stage.toJSON()});
  }

  async saveAsImage() {
    const images = [];
    const doc: any = new jsPDF({orientation: 'landscape'});
    const dirtySlides = this.slides.filter(slide => slide.stage.getLayers()[0].children.length);
    dirtySlides.forEach((slide, i) => {
      const dataUrl = slide.stage.toDataURL();
      images.push(dataUrl);
    });
    const getImageFromUrl = (src) => {
      return new Promise<any>((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = reject;
      });
    };
    const generatePdf = async (urls: string[]) => {
      for (const [i, url] of urls.entries()) {
        const image = await getImageFromUrl(url);
        const pageSize = doc.internal.pageSize;
        doc.addImage(image, 'png', 0, 0, pageSize.getWidth(), pageSize.getHeight());
        if (i !== urls.length - 1) {
          doc.addPage();
        }
      }
    };
    await generatePdf(images);
    doc.output('dataurlstring', 'file.pdf');
    doc.output('save', 'file.pdf');
  }

  stageChange() {
    return this.stageChangeSubject.asObservable();
  }

  setTool(tool: KonvaTools) {
    this.selectedTool = tool;
    this.stageChangeSubject.next({event: 'toolChange', tool});
  }

  setOption(option: KonvaOptions) {
    this.selectedOptions = {...this.selectedOptions, ...option};
    this.stageChangeSubject.next({event: 'optionChange', option: this.selectedOptions});
  }

  goToSlide(slideNumber: number) {
    const id = this.getId(slideNumber);
    this.currentSlide = this.slides.find(s => s.stage.container().id == id);
    (this._document.querySelector(`#${id}`) as any).style.display = 'block';
    this.boardContainerEl.childNodes.forEach((ch: any) => {
      if (ch.id != this.currentSlide.stage.container().id) {
        ch.style.display = 'none';
      }
    });
    setTimeout(() => {
      this.fitStageIntoParentContainer(this.currentSlide.stage);
    });
  }

  updateBoard(data: any, slideNumber: number) {
    const id = this.getId(slideNumber);
    this.init(id, data);
  }

  destroyBoard() {
    for (const slide of this.slides) {
      const slideEl = this.boardContainerEl.querySelector(`#${slide.stage.container().id}`);
      slideEl.remove();
    }
    this.slides = [];
    this.boardActivated = false;
  }

  private get boardContainerEl() {
    return this._document.querySelector('.konva-wrapper') as HTMLDivElement;
  }
}
