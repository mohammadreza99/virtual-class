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
  sessionDuration: any;
  showExamModifyDialog: boolean = false;
  showExamResultDialog: boolean = false;
  showIncomeExamDialog: boolean = false;

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

        // case 'webcamCheck':
        //   this.webcamFound = res.data.value;
        //   break;
        //
        // case 'micCheck':
        //   this.micFound = res.data.value;
        //   break;
      }
    });
  }

  initUserData() {
    this.currentRoom = this.sessionService.currentRoom;
    this.currentUser = this.sessionService.currentUser;
    this.disableWebcam = this.currentUser.muted_video;
    this.disableMic = this.currentUser.muted;
    this.raiseHandActivated = this.currentUser.raise_hand;
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
      message: this.translations.room.studentLeaveConfirm,
      rtl: this.fa,
    });
  }

  changeView(mode: ViewMode, viewModesOverlay: OverlayPanel) {
    this.currentViewMode = mode;
    viewModesOverlay.hide();
  }

  toggleMembersSidebar() {
    this.membersSidebarVisible = !this.membersSidebarVisible;
    if (this.membersSidebarVisible) {
      this.hasUnreadRaisedHands = false;
    }
  }

  toggleChatSidebar() {
    this.chatSidebarVisible = !this.chatSidebarVisible;
    if (this.chatSidebarVisible) {
      this.hasUnreadMessage = false;
    }
  }

  closeMembersSidebar() {
    this.membersSidebarVisible = false;
  }

  closeChatSidebar() {
    this.chatSidebarVisible = false;
  }

  closeSidebar(key: string) {
    this[`${key}SidebarVisible`] = false;
  }

  openSidebar(key: string) {
    const sidebars = ['members', 'chat', 'classExam', 'poll'];
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
    this.chatSidebarVisible = false;
    this.membersSidebarVisible = false;
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

  openClassExam(otherActions: OverlayPanel) {
    this.showExamModifyDialog = true;
    otherActions.hide();
  }

  onPublishExam() {
    this.showExamModifyDialog = false;
    this.showExamResultDialog = true;
  }
}
