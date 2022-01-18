import {NgModule} from '@angular/core';
import {SharedModule} from '@shared/shared.module';
import {COMPONENTS} from '.';
import {VcRoutingModule} from '@modules/vc/vc-routing.module';

@NgModule({
  declarations: [...COMPONENTS],
  exports: [...COMPONENTS],
  imports: [SharedModule, VcRoutingModule],
})
export class VcModule {
}
