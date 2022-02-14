import {Component, ComponentFactoryResolver, OnDestroy, OnInit} from '@angular/core';
import {Room, RoomUser, ViewMode} from '@core/models';
import {RoomService, SessionService} from '@core/http';
import {OverlayPanel} from 'primeng/overlaypanel';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {UtilsService} from '@ng/services';
import {ActivatedRoute, Router} from '@angular/router';
import {Subscription} from 'rxjs';
import {LocationStrategy} from '@angular/common';
import {UpdateViewService} from '@core/http/update-view.service';
import {DialogService} from 'primeng/dynamicdialog';
import {QuestionIncomeComponent} from '@modules/vc/components/question-income/question-income.component';
import {PollIncomeComponent} from '@modules/vc/components/poll-income/poll-income.component';
import {ResultTableComponent} from '@modules/vc/components/result-table/result-table.component';

@Component({
  selector: 'ng-virtual-class',
  templateUrl: './virtual-class.page.html',
  styleUrls: ['./virtual-class.page.scss'],
})
export class VirtualClassPage extends LanguageChecker implements OnInit, OnDestroy {

  constructor(private sessionService: SessionService,
              private utilsService: UtilsService,
              private roomService: RoomService,
              private location: LocationStrategy,
              private route: ActivatedRoute,
              private dialogService: DialogService,
              private updateViewService: UpdateViewService,
              private resolver: ComponentFactoryResolver,
              private router: Router) {
    super();
  }

  allUsers: RoomUser[] = [];
  roomUsers: RoomUser[] = [];
  raisedHandsUsers: RoomUser[] = [];
  disableWebcam = false;
  disableMic = false;
  screenActivated = false;
  webcamActivated = false;
  micActivated = false;
  raiseHandActivated = false;
  hasUnreadMessage = false;
  hasUnreadRaisedHands = false;
  currentViewMode: ViewMode = 'thumbnail';
  currentRoom: Room;
  currentUser: RoomUser;
  roomParticipantSubscription: Subscription;
  roomUsersSubscription: Subscription;
  raisedHandsSubscription: Subscription;
  updateViewSubscription: Subscription;
  membersSidebarVisible: boolean = true;
  chatSidebarVisible: boolean = false;
  questionSidebarVisible: boolean = false;
  pollSidebarVisible: boolean = false;
  sessionDuration: any;

  ngOnInit(): void {
    this.loadData();
  }

  async loadData() {
    if (window.innerWidth <= 767) {
      this.membersSidebarVisible = false;
    } else {
      this.membersSidebarVisible = true;
    }
    this.disableWindowBackButton();
    this.initUserData();
    this.sessionService.initRoom();
    this.calculateSessionDuration();
    this.updateViewSubscription = this.updateViewService.getViewEvent().subscribe(res => {
      switch (res.event) {
        case 'raisedHandsChange':
          const deletedIndex = this.raisedHandsUsers.findIndex(x => res.data.find(u => u.id == x.id) == undefined);
          const addedIndex = res.data.findIndex(x => this.raisedHandsUsers.find(u => u.id == x.id) == undefined);
          if (addedIndex > -1) {
            this.raisedHandsUsers.push(res.data[addedIndex]);
          }
          if (deletedIndex > -1) {
            this.raisedHandsUsers.splice(deletedIndex, 1);
          }
          break;

        case 'roomUsers':
          this.roomUsers = res.data;
          break;

        case 'roomParticipants':
          this.allUsers = res.data;
          break;

        case 'mutePerson':
        case 'muteAll':
          if (this.sessionService.currentUser.role == 'Admin') {
            return;
          }
          this.disableMic = res.data.value;
          this.micActivated = false;
          break;

        case 'muteVideo':
        case 'muteVideoAll':
          if (this.sessionService.currentUser.role == 'Admin') {
            return;
          }
          this.disableWebcam = res.data.value;
          this.webcamActivated = false;
          break;

        case 'studentRaisedHand':
          if (res.data.target == this.currentUser.id) {
            this.raiseHandActivated = res.data.value;
          }
          if (res.data.value && !this.membersSidebarVisible) {
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
            this.openIncomeQuestion(res.data.question);
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
              header: this.translations.room.poll,
              width: '500px',
              closable: true,
              rtl: this.fa
            });
          }
          break;

        case 'finishedQuestion':
        // if (this.sessionService.imStudent && res.data.question) {
        //   this.dialogService.open(ResultTableComponent, {
        //     data: res.data.question,
        //     header: this.translations.room.question,
        //     width: '500px',
        //     closable: true,
        //     rtl: this.fa
        //   });
        // }
        // break;
      }
    });
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
        this.openIncomeQuestion(result.data.question);
      }
    }
    if (this.currentRoom.active_poll && this.sessionService.imStudent) {
      const result = await this.sessionService.getPollById(this.currentRoom.active_poll).toPromise();
      if (result.status == 'OK') {
        this.openIncomePoll(result.data.poll);
      }
    }
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
    if (isTeacher) {
      dialogRes = await this.openTeacherLeaveRoomDialog();
      if (dialogRes === null) {
        return;
      }
      if (dialogRes) {
        await this.sessionService.leaveRoom().toPromise();
      } else {
        await this.sessionService.closeRoom().toPromise();
      }
      this.router.navigate(['/vc/room-info', this.currentRoom.id]);
    } else {
      dialogRes = await this.openStudentLeaveRoomDialog();
      if (dialogRes) {
        await this.sessionService.leaveRoom().toPromise();
        this.router.navigate(['/vc/room-info', this.currentRoom.id]);
      }
    }
  }

  async openTeacherLeaveRoomDialog() {
    return await this.utilsService.showConfirm({
      header: this.translations.room.leaveSession,
      message: this.translations.room.speakerLeaveConfirm,
      rtl: this.fa,
      acceptLabel: this.translations.room.leaveSession,
      rejectLabel: this.translations.room.leaveAndCloseSession,
      rejectColor: 'danger',
      rejectAppearance: 'basic'
    });
  }

  async openStudentLeaveRoomDialog() {
    return await this.utilsService.showConfirm({
      header: this.translations.room.leaveSession,
      message: this.translations.room.studentLeaveConfirm,
      rtl: this.fa,
    });
  }

  changeView(mode: ViewMode, viewModesOverlay: OverlayPanel) {
    this.currentViewMode = mode;
    viewModesOverlay.hide();
  }

  closeSidebar(key: string) {
    this[`${key}SidebarVisible`] = false;
  }

  openSidebar(key: string, overlay?: OverlayPanel) {
    const sidebars = ['members', 'chat', 'question', 'poll'];
    this[`${key}SidebarVisible`] = true;
    if (key == 'chat') {
      this.hasUnreadMessage = false;
    }
    if (key == 'members') {
      this.hasUnreadRaisedHands = false;
    }
    sidebars.forEach(k => {
      if (k != key) {
        this.closeSidebar(k);
      }
    });

    if (overlay) {
      overlay.hide();
    }
  }

  openQuestionSidebar(overlay: OverlayPanel) {
    if (this.currentRoom.active_poll) {
      this.utilsService.showToast({detail: this.translations.room.alreadyHaveOpenQuestionnaire, severity: 'warn'});
      overlay.hide();
      return;
    }
    this.openSidebar('question', overlay);
  }

  openPollSidebar(overlay: OverlayPanel) {
    if (this.currentRoom.active_question) {
      this.utilsService.showToast({detail: this.translations.room.alreadyHaveOpenQuestionnaire, severity: 'warn'});
      overlay.hide();
      return;
    }
    this.openSidebar('poll', overlay);
  }

  async copySessionLink(sessionInfoOverlay: OverlayPanel) {
    const data = await this.roomService.generateRoomLink(this.currentRoom.id).toPromise();
    await navigator.clipboard.writeText(data.data.link);
    sessionInfoOverlay.hide();
  }

  disableWindowBackButton() {
    history.pushState(null, null, location.href);
    this.location.onPopState(() => {
      history.pushState(null, null, location.href);
    });
  }

  calculateSessionDuration() {
    this.sessionDuration = this.utilsService.convertToTimeFormat(this.currentRoom.session_duration++);
    setInterval(() => {
      this.sessionDuration = this.utilsService.convertToTimeFormat(this.currentRoom.session_duration++);
    }, 1000);
  }

  ngOnDestroy(): void {
    this.closeSidebar('chat');
    this.closeSidebar('members');
    this.roomUsersSubscription.unsubscribe();
    this.raisedHandsSubscription.unsubscribe();
    this.updateViewSubscription.unsubscribe();
    this.roomParticipantSubscription.unsubscribe();
  }

  onGetNewMessage() {
    if (!this.chatSidebarVisible) {
      this.hasUnreadMessage = true;
    }
  }

  anySidebarVisible() {
    return this.membersSidebarVisible || this.chatSidebarVisible || this.questionSidebarVisible || this.pollSidebarVisible;
  }

  openIncomeQuestion(question: any) {
    this.dialogService.open(QuestionIncomeComponent, {
      data: question,
      header: this.translations.room.question,
      width: '600px',
      closable: false,
      rtl: this.fa
    }).onClose.subscribe(res => {
      if (res) {
        this.sessionService.replyQuestion(question.id, res).toPromise();
      }
    });
  }

  openIncomePoll(poll: any) {
    this.dialogService.open(PollIncomeComponent, {
      data: poll,
      header: this.translations.room.poll,
      width: '600px',
      closable: false,
      rtl: this.fa
    }).onClose.subscribe(res => {
      if (res) {
        this.sessionService.replyPoll(poll.id, res).toPromise();
      }
    });
  }

  questionRevoked() {
    this.currentRoom.active_question = null;
  }

  pollRevoked() {
    this.currentRoom.active_poll = null;
  }

  questionPublished(event: number) {
    this.currentRoom.active_question = event;
  }

  pollPublished(event: number) {
    this.currentRoom.active_poll = event;
  }

  async exportAttendance(otherActions: OverlayPanel) {
    const result = await this.sessionService.exportAttendance().toPromise();
    if (result.status == 'OK') {
      const a = document.createElement('a');
      a.href = result.data.url;
      a.download = result.data.url.split('/').pop();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    otherActions.hide();
  }
}
