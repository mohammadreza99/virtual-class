import {Component, ComponentFactoryResolver, OnDestroy, OnInit} from '@angular/core';
import {PollItem, QuestionItem, Room, RoomUser, ViewMode} from '@core/models';
import {AuthService, RoomService, SessionService} from '@core/http';
import {OverlayPanel} from 'primeng/overlaypanel';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {UtilsService} from '@ng/services';
import {ActivatedRoute, Router} from '@angular/router';
import {Subject} from 'rxjs';
import {LocationStrategy} from '@angular/common';
import {KonvaService, UpdateViewService} from '@core/utils';
import {DialogService} from 'primeng/dynamicdialog';
import {QuestionIncomeComponent} from '@modules/vc/components/question-income/question-income.component';
import {PollIncomeComponent} from '@modules/vc/components/poll-income/poll-income.component';
import {ResultTableComponent} from '@modules/vc/components/result-table/result-table.component';
import {QuestionResultComponent} from '@modules/vc/components/question-result/question-result.component';
import {UploadFileFormComponent} from '@modules/vc/components/upload-file-form/upload-file-form.component';
import {takeUntil} from 'rxjs/operators';
import {SelectRandomUserComponent} from '@modules/vc/components/select-random-user/select-random-user.component';
import {VideoLinkFormComponent} from '@modules/vc/components/video-link-form/video-link-form.component';

@Component({
  selector: 'ng-virtual-class',
  templateUrl: './virtual-class.page.html',
  styleUrls: ['./virtual-class.page.scss'],
})
export class VirtualClassPage extends LanguageChecker implements OnInit, OnDestroy {

  constructor(private sessionService: SessionService,
              private utilsService: UtilsService,
              private roomService: RoomService,
              private authService: AuthService,
              private location: LocationStrategy,
              private route: ActivatedRoute,
              private dialogService: DialogService,
              private updateViewService: UpdateViewService,
              private resolver: ComponentFactoryResolver,
              private konvaService: KonvaService,
              private router: Router) {
    super();
  }

  allUsers: RoomUser[] = [];
  roomUsers: RoomUser[] = [];
  raisedHandsUsers: RoomUser[] = [];
  kickedUsers: RoomUser[] = [];
  disableWebcam = false;
  disableMic = false;
  screenActivated = false;
  webcamActivated = false;
  micActivated = false;
  raiseHandActivated = false;
  presentationActivated: boolean = false;
  whiteboardActivated: boolean = false;
  hasUnreadMessage = false;
  hasUnreadRaisedHands = false;
  currentViewMode: ViewMode = 'thumbnail';
  currentRoom: Room;
  currentUser: RoomUser;
  currentQuestion: QuestionItem;
  currentPoll: PollItem;
  toggleMembersSidebar: boolean = true;
  toggleChatSidebar: boolean = false;
  toggleQuestionSidebar: boolean = false;
  togglePollSidebar: boolean = false;
  sessionDuration: string;
  sidebarKeys = ['members', 'chat', 'question', 'poll'];
  destroy$: Subject<boolean> = new Subject<boolean>();

  ngOnInit(): void {
    this.loadData();
  }

  async loadData() {
    // let poorConnectionRetryCount = GlobalConfig.poorConnectionRetryCount;

    // interval(GlobalConfig.checkConnectionSpeedDelay).pipe(takeUntil(this.destroy$)).subscribe(res => {
    //   this.utilsService.checkConnectionState((speed) => {
    //     if (speed < GlobalConfig.poorConnectionThreshold) {
    //       console.log('poor connection detected');
    //       poorConnectionRetryCount--;
    //       if (poorConnectionRetryCount == 0) {
    //         this.utilsService.showToast({
    //           detail: this.instant('room.networkIssueDetected'),
    //           severity: 'warn'
    //         });
    //         this.router.navigate(['/vc/room-info', this.currentRoom.id]);
    //       }
    //     }
    //   });
    // });

    this.updateViewService.getViewEvent().pipe(takeUntil(this.destroy$)).subscribe(async res => {
      switch (res.event) {
        case 'raiseHandsChange':
          const deletedIndex = this.raisedHandsUsers.findIndex(x => res.data.find(u => u.id == x.id) == undefined);
          const addedIndex = res.data.findIndex(x => this.raisedHandsUsers.find(u => u.id == x.id) == undefined);
          if (addedIndex > -1) {
            this.raisedHandsUsers.push(res.data[addedIndex]);
          }
          if (deletedIndex > -1) {
            this.raisedHandsUsers.splice(deletedIndex, 1);
          }
          break;

        case 'roomParticipantsChange':
          this.allUsers = res.data.filter(u => !u.kicked);
          break;

        case 'userContainersChange':
          this.roomUsers = res.data.filter(u => !u.kicked);
          break;

        case 'kickedUsersChange':
          this.kickedUsers = res.data;
          break;

        case 'mutePerson':
        case 'muteAll':
          if (this.sessionService.imTeacher) {
            return;
          }
          this.disableMic = res.data.value;
          this.micActivated = false;
          break;

        case 'onDisconnect':
          if (res.data.userId != this.currentUser.id) {
            return;
          }
          if (res.data.publishType == 'Screen') {
            this.screenActivated = false;
          } else if (res.data.publishType == 'Webcam') {
            this.webcamActivated = false;
          }
          break;

        case 'muteVideo':
        case 'muteVideoAll':
          if (this.sessionService.imTeacher) {
            return;
          }
          this.disableWebcam = res.data.value;
          this.webcamActivated = false;
          break;

        case 'studentRaisedHand':
          if (res.data.target == this.currentUser.id) {
            this.raiseHandActivated = res.data.value;
          }
          if (res.data.value && !this.toggleMembersSidebar) {
            this.hasUnreadRaisedHands = true;
          }
          break;

        case 'teacherConfirmRaisedHand':
          if (res.data.target == this.currentUser.id) {
            this.raiseHandActivated = res.data.value;
          }
          break;

        case 'newQuestion':
          if (this.sessionService.imStudent) {
            this.currentQuestion = res.data.question;
            this.openIncomeQuestion(this.currentQuestion);
          }
          break;

        case 'newPoll':
          if (this.sessionService.imStudent) {
            this.openIncomePoll(res.data.poll);
          }
          break;

        case 'finishedPoll':
          if (this.sessionService.imStudent && res.data.poll) {
            this.dialogService.open(ResultTableComponent, {
              data: res.data.poll,
              header: this.instant('room.pollResult'),
              width: '500px',
              closable: true,
              rtl: this.fa
            });
          }
          break;

        case 'finishedQuestion':
          if (this.sessionService.imStudent) {
            let question: QuestionItem = this.currentQuestion;
            if (!question) {
              const result = await this.sessionService.getQuestionById(res.data.question_id).toPromise();
              if (result.status == 'OK') {
                question = result.data.question;
              }
            }
            const result = await this.sessionService.getQuestionSelfReplies(res.data.question_id).toPromise();
            let myAnswers;
            if (result.status == 'OK') {
              myAnswers = result.data.replies;
            }
            this.dialogService.open(QuestionResultComponent, {
              data: {question, correctAnswers: res.data.correct_answers, myAnswers},
              header: this.instant('room.questionResult'),
              width: '500px',
              closable: true,
              rtl: this.fa
            });
          }
          break;

        case 'openPresentation':
          this.presentationActivated = true;
          break;

        case 'closePresentation':
          this.presentationActivated = false;
          break;

        case 'openBoard':
        case 'startBoard':
          this.whiteboardActivated = true;
          break;

        case 'closeBoard':
          this.whiteboardActivated = false;
          break;

        case 'gotNewPrivateMessage':
        case 'gotNewPublicMessage':
          if (!this.toggleChatSidebar) {
            this.hasUnreadMessage = true;
          }
          break;
      }
    });
    this.utilsService.disableWindowBackButton();
    this.initUserData();
    this.sessionService.initRoom();
    this.calculateSessionDuration();
  }

  async initUserData() {
    this.currentRoom = this.sessionService.currentRoom;
    this.currentUser = this.sessionService.currentUser;
    this.disableWebcam = this.currentUser.muted_video;
    this.disableMic = this.currentUser.muted;
    this.raiseHandActivated = this.currentUser.raise_hand;
    if (this.currentRoom.active_question && this.sessionService.imStudent) {
      const result = await this.sessionService.getQuestionById(this.currentRoom.active_question).toPromise();
      if (result.status == 'OK') {
        this.currentQuestion = result.data.question;
        this.openIncomeQuestion(this.currentQuestion);
      }
    }
    if (this.currentRoom.active_poll && this.sessionService.imStudent) {
      const result = await this.sessionService.getPollById(this.currentRoom.active_poll).toPromise();
      if (result.status == 'OK') {
        this.openIncomePoll(result.data.poll);
      }
    }
    if (this.currentRoom.presentation) {
      setTimeout(() => {
        this.updateViewService.setViewEvent({event: 'openPresentation', data: this.currentRoom.presentation});
      });
    }
    if (this.currentRoom.board) {
      const res = await this.sessionService.getBoard(this.currentRoom.board.id).toPromise();
      if (res.status == 'OK') {
        this.updateViewService.setViewEvent({event: 'openBoard', data: res.data.board});
        this.currentRoom.board.users.forEach(id => {
          this.updateViewService.setViewEvent({event: 'setBoardPermission', data: {user_id: id}});
        });
      }
    }
    this.updateViewService.setViewEvent({
      event: 'messageMutedUser',
      data: {user_id: this.currentUser.id, state: this.currentUser.user_message_state}
    });
    this.updateViewService.setViewEvent({
      event: 'publicChatState',
      data: {value: this.currentRoom.public_messages}
    });
  }

  async toggleCamera(callback: (toggleState?: boolean) => any) {
    try {
      this.webcamActivated = !this.webcamActivated;
      await this.sessionService.toggleMyVideo(this.webcamActivated);
      callback();
    } catch (error) {
      console.error(error);
      this.webcamActivated = false;
      callback(false);
    }
  }

  async toggleMic(callback: (toggleState?: boolean) => any) {
    try {
      this.micActivated = !this.micActivated;
      if (!this.micActivated) {
        this.updateViewService.setViewEvent({
          event: 'isTalking',
          data: {value: false, target: this.sessionService.currentUser.id}
        });
      }
      await this.sessionService.toggleMyAudio(this.micActivated);
      callback();
    } catch (error) {
      console.error(error);
      this.micActivated = false;
      callback(false);
    }
  }

  async toggleScreen(callback: (toggleState?: boolean) => any) {
    try {
      this.screenActivated = !this.screenActivated;
      await this.sessionService.toggleMyScreen(this.screenActivated);
      callback();
    } catch (error) {
      console.error(error);
      this.screenActivated = false;
      callback(false);
    }
  }

  async toggleRaiseHand(callback: (toggleState?: boolean) => any) {
    try {
      this.raiseHandActivated = !this.raiseHandActivated;
      await this.sessionService.raiseHand(this.raiseHandActivated).toPromise();
      callback();
    } catch (error) {
      console.error(error);
      this.raiseHandActivated = false;
      callback(false);
    }
  }

  async leaveRoom() {
    const isTeacher = this.sessionService.imTeacher;
    let dialogRes;
    let res;
    if (isTeacher) {
      dialogRes = await this.openTeacherLeaveRoomDialog();
      if (dialogRes === null) {
        return;
      }
      if (dialogRes) {
        res = await this.sessionService.leaveRoom().toPromise();
      } else {
        res = await this.sessionService.closeRoom().toPromise();
      }
      if (res.status == 'OK') {
        this.sessionService.getMeOut();
      }
    } else {
      dialogRes = await this.openStudentLeaveRoomDialog();
      if (dialogRes) {
        res = await this.sessionService.leaveRoom().toPromise();
        if (res.status == 'OK') {
          this.sessionService.getMeOut();
        }
      }
    }
  }

  async openTeacherLeaveRoomDialog() {
    return await this.utilsService.showConfirm({
      header: this.instant('room.leaveSession'),
      message: this.instant('room.speakerLeaveConfirm'),
      rtl: this.fa,
      acceptLabel: this.instant('room.leaveSession'),
      rejectLabel: this.instant('room.leaveAndCloseSession'),
      rejectColor: 'danger',
      rejectAppearance: 'basic'
    });
  }

  async openStudentLeaveRoomDialog() {
    return await this.utilsService.showConfirm({
      header: this.instant('room.leaveSession'),
      message: this.instant('room.studentLeaveConfirm'),
      rtl: this.fa,
    });
  }

  calculateSessionDuration() {
    this.sessionDuration = this.utilsService.convertToTimeFormat(this.currentRoom.session_duration++);
    setInterval(() => {
      this.sessionDuration = this.utilsService.convertToTimeFormat(this.currentRoom.session_duration++);
    }, 1000);
  }

  closeAllSidebars(exceptionKey?: string) {
    for (const key of this.sidebarKeys) {
      if (exceptionKey && key == exceptionKey) {
        continue;
      }
      this.closeSidebar(key);
    }
  }

  closeSidebar(key: string) {
    const pascalCase = key.replace(/(\w)(\w*)/g,
      (g0, g1, g2) => (g1.toUpperCase() + g2.toLowerCase()));
    this[`toggle${pascalCase}Sidebar`] = false;
    setTimeout(() => {
      this.konvaService.fitStageIntoParentContainer();
    }, 500);
  }

  anySidebarVisible() {
    return this.toggleMembersSidebar || this.toggleChatSidebar || this.toggleQuestionSidebar || this.togglePollSidebar;
  }

  openIncomeQuestion(question: QuestionItem) {
    this.dialogService.open(QuestionIncomeComponent, {
      data: question,
      header: this.instant('room.question'),
      width: '600px',
      closable: false,
      rtl: this.fa
    }).onClose.pipe(takeUntil(this.destroy$)).subscribe(res => {
      if (res) {
        this.sessionService.replyQuestion(question.id, res).toPromise();
      }
    });
  }

  openIncomePoll(poll: any) {
    this.dialogService.open(PollIncomeComponent, {
      data: poll,
      header: this.instant('room.poll'),
      width: '600px',
      closable: false,
      rtl: this.fa
    }).onClose.pipe(takeUntil(this.destroy$)).subscribe(res => {
      if (res) {
        this.sessionService.replyPoll(poll.id, res).toPromise();
      }
    });
  }

  onQuestionRevoked() {
    this.currentRoom.active_question = null;
  }

  onPollRevoked() {
    this.currentRoom.active_poll = null;
  }

  onQuestionPublished(event: number) {
    this.currentRoom.active_question = event;
  }

  onPollPublished(event: number) {
    this.currentRoom.active_poll = event;
  }

  changeView(mode: ViewMode, overlay: OverlayPanel) {
    this.currentViewMode = mode;
    overlay.hide();
  }

  openSidebar(key: string, overlay?: OverlayPanel) {
    const pascalCase = key.replace(/(\w)(\w*)/g,
      (g0, g1, g2) => (g1.toUpperCase() + g2.toLowerCase()));
    this[`toggle${pascalCase}Sidebar`] = true;
    if (key == 'chat') {
      this.hasUnreadMessage = false;
    }
    if (key == 'members') {
      this.hasUnreadRaisedHands = false;
    }
    this.closeAllSidebars(key);

    if (overlay) {
      overlay.hide();
    }
    setTimeout(() => {
      this.konvaService.fitStageIntoParentContainer();
    }, 500);
  }

  openQuestionSidebar(overlay: OverlayPanel) {
    if (this.currentRoom.active_poll) {
      this.utilsService.showToast({detail: this.instant('room.alreadyHaveOpenQuestionnaire'), severity: 'warn'});
      overlay.hide();
      return;
    }
    this.openSidebar('question', overlay);
  }

  openPollSidebar(overlay: OverlayPanel) {
    if (this.currentRoom.active_question) {
      this.utilsService.showToast({detail: this.instant('room.alreadyHaveOpenQuestionnaire'), severity: 'warn'});
      overlay.hide();
      return;
    }
    this.openSidebar('poll', overlay);
  }

  async copySessionLink(overlay: OverlayPanel) {
    const data = await this.roomService.generateRoomLink(this.currentRoom.id).toPromise();
    await navigator.clipboard.writeText(data.data.link);
    overlay.hide();
  }

  async exportSessionAttendance(overlay: OverlayPanel) {
    const result = await this.sessionService.exportSessionAttendance().toPromise();
    if (result.status == 'OK') {
      const a = document.createElement('a');
      a.href = result.data.url;
      a.download = result.data.url.split('/').pop();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    overlay.hide();
  }

  uploadFile(overlay: OverlayPanel) {
    if (this.isPresentationAreaBusy()) {
      this.utilsService.showToast({detail: this.instant('room.pleaseCloseCurrentPresentation'), severity: 'warn'});
      return;
    }
    this.dialogService.open(UploadFileFormComponent, {
      header: this.instant('room.sendFile'),
      width: '500px',
      closable: true,
      rtl: this.fa
    }).onClose.pipe(takeUntil(this.destroy$)).subscribe((res) => {
    });
    overlay.hide();
  }

  selectRandomUser(overlay: OverlayPanel) {
    this.dialogService.open(SelectRandomUserComponent, {
      header: this.instant('room.selectRandomUser'),
      width: '500px',
      closable: true,
      rtl: this.fa
    }).onClose.pipe(takeUntil(this.destroy$)).subscribe(res => {
      if (res) {
        this.sessionService.selectRandomUser(res.id).toPromise();
      }
    });
    overlay.hide();
  }

  async toggleWhiteboard(overlay: OverlayPanel) {
    if (this.isPresentationAreaBusy()) {
      this.utilsService.showToast({detail: this.instant('room.pleaseCloseCurrentPresentation'), severity: 'warn'});
      return;
    }
    overlay.hide();
    this.whiteboardActivated = !this.whiteboardActivated;
    if (this.whiteboardActivated) {
      this.openBoard();
    } else {
      this.closeBoard();
    }
  }

  openBoard() {
    this.sessionService.openBoard(true).toPromise();
  }

  closeBoard() {
    this.sessionService.closeBoard().toPromise();
  }

  sendVideoLink(mediaActions: OverlayPanel) {
    if (this.isPresentationAreaBusy()) {
      this.utilsService.showToast({detail: this.instant('room.pleaseCloseCurrentPresentation'), severity: 'warn'});
      return;
    }
    mediaActions.hide();
    this.dialogService.open(VideoLinkFormComponent, {header: this.instant('room.sendVideoLink')}).onClose.subscribe(res => {
      if (res) {
        this.sessionService.uploadVideoLink(res).toPromise();
      }
    });
  }

  isPresentationAreaBusy() {
    return this.presentationActivated || this.whiteboardActivated || this.screenActivated;
  }

  ngOnDestroy(): void {
    this.closeAllSidebars();
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
