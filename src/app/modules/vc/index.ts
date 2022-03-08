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
import {QuestionManagementComponent} from '@modules/vc/components/question-management/question-management.component';
import {PollManagementComponent} from '@modules/vc/components/poll-management/poll-management.component';
import {QuestionIncomeComponent} from '@modules/vc/components/question-income/question-income.component';
import {PollIncomeComponent} from '@modules/vc/components/poll-income/poll-income.component';
import {ResultTableComponent} from '@modules/vc/components/result-table/result-table.component';
import {QuestionResultComponent} from '@modules/vc/components/question-result/question-result.component';
import {UploadFileComponent} from '@modules/vc/components/upload-file/upload-file.component';
import {SelectRandomUserComponent} from '@modules/vc/components/select-random-user/select-random-user.component';
import {CanvasWhiteboardComponent} from '@modules/vc/components/canvas-whiteboard/canvas-whiteboard.component';

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
  QuestionManagementComponent,
  PollManagementComponent,
  QuestionIncomeComponent,
  QuestionResultComponent,
  PollIncomeComponent,
  ResultTableComponent,
  UploadFileComponent,
  SelectRandomUserComponent,
  CanvasWhiteboardComponent,
];
