import {Component, ComponentFactoryResolver, OnDestroy, OnInit, ViewChild, ViewContainerRef} from '@angular/core';
import {Room, RoomUser, ViewMode} from '@core/models';
import {RoomService, SessionService} from '@core/http';
import {OverlayPanel} from 'primeng/overlaypanel';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {UtilsService} from '@ng/services';
import {ActivatedRoute, Router} from '@angular/router';
import {Subscription} from 'rxjs';
import {LocationStrategy} from '@angular/common';
import {UpdateViewService} from '@core/http/update-view.service';
import {MessageItemComponent} from '@modules/vc/components/message-item/message-item.component';

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

  // @ViewChild('chatItemContainer', {static: true, read: ViewContainerRef}) chatContainer: ViewContainerRef;

  allUsers: RoomUser[] = [];
  roomUsers: RoomUser[] = [];
  raisedHandsUsers: RoomUser[] = [];
  disableWebcam = false;
  disableMic = false;
  // webcamFound: boolean;
  // micFound: boolean;
  screenActivated = false;
  webcamActivated = false;
  micActivated = false;
  raiseHandActivated = false;
  currentViewMode: ViewMode = 'thumbnail';
  currentRoom: Room;
  currentUser: RoomUser;
  // allMuted: boolean = true;
  // allMutedVideo: boolean = false;
  // searchText: string;
  roomParticipantSubscription: Subscription;
  roomUsersSubscription: Subscription;
  raisedHandsSubscription: Subscription;
  updateViewSubscription: Subscription;
  // chatText: string;
  membersSidebarVisible: boolean = true;
  chatSidebarVisible: boolean = false;
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
    this.roomParticipantSubscription = this.sessionService.onRoomParticipantsChange().subscribe(res => {
      this.allUsers = res;
    });
    this.roomUsersSubscription = this.sessionService.onRoomUsersChange().subscribe(res => {
      this.roomUsers = res;
    });
    this.raisedHandsSubscription = this.sessionService.onRaisedHandsChange().subscribe(res => {
      const deletedIndex = this.raisedHandsUsers.findIndex(x => res.find(u => u.id == x.id) == undefined);
      const addedIndex = res.findIndex(x => this.raisedHandsUsers.find(u => u.id == x.id) == undefined);
      if (addedIndex > -1) {
        this.raisedHandsUsers.push(res[addedIndex]);
      }
      if (deletedIndex > -1) {
        this.raisedHandsUsers.splice(deletedIndex, 1);
      }
    });
    this.updateViewSubscription = this.updateViewService.getViewEvent().subscribe(res => {
      switch (res.event) {
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

        case 'raiseHand':
          if (res.data.target == this.currentUser.id) {
            this.raiseHandActivated = res.data.value;
          }
          break;

        case 'activateWebcamButton':
          this.webcamActivated = false;
          break;


        case 'activateMicButton':
          this.micActivated = false;
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

  // async toggleMuteAll(event) {
  //   try {
  //     await this.sessionService.muteAll(!event.checked).toPromise();
  //     this.allMuted = !event.checked;
  //   } catch (error) {
  //     console.error(error);
  //     throw error;
  //   }
  // }

  // async toggleMuteVideoAll(event) {
  //   try {
  //     await this.sessionService.muteVideoAll(!event.checked).toPromise();
  //     this.allMutedVideo = !event.checked;
  //   } catch (error) {
  //     console.error(error);
  //     throw error;
  //   }
  // }

  changeView(mode: ViewMode, viewModesOverlay: OverlayPanel) {
    this.currentViewMode = mode;
    viewModesOverlay.hide();
  }

  toggleMembersSidebar() {
    this.membersSidebarVisible = !this.membersSidebarVisible;
  }

  toggleChatSidebar() {
    this.chatSidebarVisible = !this.chatSidebarVisible;
  }

  closeMembersSidebar() {
    this.membersSidebarVisible = false;
  }

  closeChatSidebar() {
    this.chatSidebarVisible = false;
  }

  // async sendMessage(container: HTMLElement) {
  //   if (this.chatText) {
  //     const result = this.sessionService.sendPublicMessage(this.chatText).toPromise();
  //     const factory = this.resolver.resolveComponentFactory(MessageItemComponent);
  //     const cmpRef = this.chatContainer.createComponent(factory);
  //     cmpRef.instance.position = 'right';
  //     cmpRef.instance.message = {text: this.chatText, sender: this.currentUser.first_name, time: '12:23'};
  //     this.chatText = '';
  //     setTimeout(() => {
  //       container.scrollTop = container.scrollHeight;
  //     }, 0);
  //   }
  // }

  async copySessionLink(sessionInfoOverlay: OverlayPanel) {
    const data = await this.roomService.generateRoomLink(this.currentRoom.id).toPromise();
    await navigator.clipboard.writeText(data.data.link);
    sessionInfoOverlay.hide();
  }

  // trackByFn(index: number, item: RoomUser): number {
  //   return item.id;
  // }
  //
  // getColumnTemplate() {
  //   const usersCount = this.allUsers.length;
  //   if (usersCount == 1) {
  //     return 'g-full';
  //   } else if (usersCount >= 2 && usersCount <= 4) {
  //     return 'g-four';
  //   } else if (usersCount >= 5 && usersCount <= 9) {
  //     return 'g-nine';
  //   } else if (usersCount >= 10 && usersCount <= 16) {
  //     return 'g-sixteen';
  //   } else if (usersCount >= 17) {
  //     return 'g-twenty-five';
  //   }
  // }

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
    this.roomUsersSubscription.unsubscribe();
    this.raisedHandsSubscription.unsubscribe();
    this.updateViewSubscription.unsubscribe();
    this.roomParticipantSubscription.unsubscribe();
  }
}
