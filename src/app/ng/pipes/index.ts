import {Type} from '@angular/core';
import {DatePipe} from './date.pipe';
import {DotsPipe} from './dots.pipe';
import {FilterPipe} from './filter.pipe';
import {SafePipe} from './safe.pipe';
import {ToBase64Pipe} from './to-base64.pipe';
import {MonthTextPipe} from './month-text.pipe';

export const PIPES: Type<any>[] = [
  DotsPipe,
  SafePipe,
  DatePipe,
  FilterPipe,
  ToBase64Pipe,
  MonthTextPipe
];
