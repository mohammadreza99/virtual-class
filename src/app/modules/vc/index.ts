import {Type} from '@angular/core';
import {VirtualClassPage} from '@modules/vc/pages/virtual-class/virtual-class.page';
import {ScreenComponent} from '@modules/vc/components/screen/screen.component';
import {MainPlaceholderComponent} from '@modules/vc/components/main-placeholder/main-placeholder.component';
import {UserItemComponent} from '@modules/vc/components/user-item/user-item.component';
import {RoomInfoPage} from '@modules/vc/pages/room-info/room-info.page';
import {MessageItemComponent} from '@modules/vc/components/message-item/message-item.component';
import {KickUserConfirmComponent} from '@modules/vc/components/kick-user-confirm/kick-user-confirm.component';
import {ParticipantsComponent} from '@modules/vc/components/participants/participants.component';
import {ChatComponent} from '@modules/vc/components/chat/chat.component';
import {ThumbnailViewComponent} from '@modules/vc/components/thumbnail-view/thumbnail-view.component';
import {GridViewComponent} from '@modules/vc/components/grid-view/grid-view.component';
import {SpeakerViewComponent} from '@modules/vc/components/speaker-view/speaker-view.component';
import {ExamModifyComponent} from '@modules/vc/components/exam-modify/exam-modify.component';
import {ExamResultComponent} from '@modules/vc/components/exam-result/exam-result.component';
import {IncomeExamComponent} from '@modules/vc/components/income-exam/income-exam.component';

export const COMPONENTS: Type<any>[] = [
  VirtualClassPage,
  RoomInfoPage,
  KickUserConfirmComponent,
  MessageItemComponent,
  UserItemComponent,
  MainPlaceholderComponent,
  ScreenComponent,
  ParticipantsComponent,
  ChatComponent,
  ThumbnailViewComponent,
  GridViewComponent,
  SpeakerViewComponent,
  ExamModifyComponent,
  ExamResultComponent,
  IncomeExamComponent
];
