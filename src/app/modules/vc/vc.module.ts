import {NgModule} from '@angular/core';
import {SharedModule} from '@shared/shared.module';
import {COMPONENTS} from '.';
import {VcRoutingModule} from '@modules/vc/vc-routing.module';
import {PickerModule} from '@ctrl/ngx-emoji-mart';

@NgModule({
  declarations: [...COMPONENTS],
  exports: [...COMPONENTS],
  imports: [SharedModule, VcRoutingModule, PickerModule],
})
export class VcModule {
}
