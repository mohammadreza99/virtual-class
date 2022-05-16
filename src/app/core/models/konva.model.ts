import {Shape} from 'konva/lib/Shape';
import {Group} from '@core/models/group.model';
import {Layer} from 'konva/lib/Layer';
import {Stage} from 'konva/lib/Stage';

export const availableThicknesses = [1, 2, 4, 6, 8, 10, 12, 14] as const;
export const availableTextSizes = [16, 20, 24, 28, 32, 36] as const;
export const availableColors = ['#000000', '#ffffff', '#ff0000', '#ff8800', '#ccff00', '#00ff00', '#00ffff', '#0088ff', '#0000ff', '#8800ff', '#ff00ff', '#c0c0c0'] as const;
export type Thicknesses = (typeof availableThicknesses)[number];
export type TextSizes = (typeof availableTextSizes)[number];
export type Colors = (typeof availableColors)[number];
export type KonvaTools =
  'select'
  | 'text'
  | 'brush'
  | 'eraser'
  | 'image'
  | 'triangle'
  | 'circle'
  | 'line'
  | 'rectangle';
export type StageEvents = 'toolChange' | 'optionChange' | 'updateBoard';
export type OverlayMode = 'tools' | 'thicknesses' | 'textSizes' | 'colors';

export interface WhiteboardSlide {
  slideNumber: number;
  data: any;
}

export interface KonvaOptions {
  thickness?: Thicknesses;
  color?: Colors;
  textSize?: TextSizes;
}

export interface CanvasItem {
  stage: Stage;
  layer: Layer;
  shapes: (Shape | Group | any)[];
}
