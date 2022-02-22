import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {NgAllModule} from '@ng/all.module';
import {TranslateModule} from '@ngx-translate/core';
import {COMPONENTS} from '.';
import {OverlayModule} from '@angular/cdk/overlay';
import {ImageCropperModule} from 'ngx-image-cropper';
import {CanvasWhiteboardModule} from 'ng2-canvas-whiteboard';
import {NgWhiteboardModule} from 'ng-whiteboard';

@NgModule({
  declarations: [...COMPONENTS],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    TranslateModule.forChild(),
    RouterModule,
    NgAllModule.forRoot({ripple: true}),
    ImageCropperModule,
    CanvasWhiteboardModule,
    NgWhiteboardModule
  ],
  exports: [
    ...COMPONENTS,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    TranslateModule,
    NgAllModule,
    OverlayModule,
    CanvasWhiteboardModule,
    NgWhiteboardModule
  ],
  providers: [],
})
export class SharedModule {
}
