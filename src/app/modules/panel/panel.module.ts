import {NgModule} from '@angular/core';
import {SharedModule} from '@shared/shared.module';
import {PanelRoutingModule} from './panel-routing.module';
import {COMPONENTS} from '.';

@NgModule({
  imports: [PanelRoutingModule, SharedModule],
  declarations: [...COMPONENTS],
})
export class PanelModule {
}
