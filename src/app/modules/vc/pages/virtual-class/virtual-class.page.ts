import {Component, HostListener, OnDestroy, OnInit} from '@angular/core';
import {Room, RoomUser, StreamActionEvent, ViewMode} from '@core/models';
import {SessionService} from '@core/http';
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
  styleUrls: ['./virtual-class.page.scss']
})
export class VirtualClassPage extends LanguageChecker implements OnInit, OnDestroy {

  constructor(private sessionService: SessionService,
              private utilsService: UtilsService,
              private location: LocationStrategy,
              private route: ActivatedRoute,
              private updateViewService: UpdateViewService,
              private router: Router) {
    super();
  }

  allUsers: RoomUser[] = [];
  roomUsers: RoomUser[] = [];
  raisedHandsUsers: RoomUser[] = [];
  sidebarVisible: boolean = true;
  disableWebcam = false;
  disableMic = false;
  webcamFound: boolean;
  micFound: boolean;
  screenActivated = false;
  webcamActivated = false;
  micActivated = false;
  raiseHandActivated = false;
  currentViewMode: ViewMode = 'thumbnail';
  currentRoom: Room;
  currentUser: RoomUser;
  allMuted: boolean = true;
  allMutedVideo: boolean = false;
  searchText: string;
  roomParticipantSubscription: Subscription;
  roomUsersSubscription: Subscription;
  raisedHandsSubscription: Subscription;
  updateViewSubscription: Subscription;


  ngOnInit(): void {
    this.loadData();
  }

  async loadData() {
    this.disableWindowBackButton();
    this.initUserData();
    this.sessionService.initRoom();
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
          this.disableMic = res.data;
          this.micActivated = false;
          break;

        case 'muteVideo':
        case 'muteVideoAll':
          if (this.sessionService.currentUser.role == 'Admin') {
            return;
          }
          this.disableWebcam = res.data;
          this.webcamActivated = false;
          break;

        case 'raiseHandAccepted':
          this.raiseHandActivated = false;
          break;

        case 'activateWebcamButton':
          this.webcamActivated = false;
          break;

        // case 'webcamCheck':
        //   this.webcamFound = res.data;
        //   break;
        //
        // case 'micCheck':
        //   this.micFound = res.data;
        //   break;

        case 'closeSidebar':
          this.sidebarVisible = false;
          break;
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
    const teacherConfirm = this.translationService.instant('room.speakerLeaveConfirm') as string;
    const studentConfirm = this.translationService.instant('room.studentLeaveConfirm') as string;
    const dialogRes = await this.utilsService.showConfirm({
      message: isTeacher ? teacherConfirm : studentConfirm,
      rtl: this.fa
    });
    if (dialogRes) {
      this.sidebarVisible = false;
      await this.sessionService.leaveRoom().toPromise();
      if (isTeacher) {
        await this.sessionService.closeRoom().toPromise();
      }
      this.router.navigate(['/vc/room-info', this.currentRoom.id]);
    }
  }

  async toggleMuteAll(event) {
    try {
      await this.sessionService.muteAll(!event.checked).toPromise();
      this.allMuted = !event.checked;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async toggleMuteVideoAll(event) {
    try {
      await this.sessionService.muteVideoAll(!event.checked).toPromise();
      this.allMutedVideo = !event.checked;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  changeView(mode: ViewMode, viewModesOverlay: OverlayPanel) {
    this.currentViewMode = mode;
    viewModesOverlay.hide();
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }

  closeSidebar() {
    this.sidebarVisible = false;
  }

  clearSearch() {
    this.searchText = '';
  }

  async copySessionLink(sessionInfoOverlay: OverlayPanel) {
    await this.sessionService.copySessionLink();
    sessionInfoOverlay.hide();
  }

  trackByFn(index: number, item: RoomUser): number {
    return item.id;
  }

  getColumnTemplate() {
    const usersCount = this.allUsers.length;
    if (usersCount == 1) {
      return 'g-full';
    } else if (usersCount >= 2 && usersCount <= 4) {
      return 'g-one-fourth';
    } else if (usersCount >= 5 && usersCount <= 9) {
      return 'g-one-ninth';
    } else if (usersCount >= 10 && usersCount <= 16) {
      return 'g-one-sixteenth';
    } else if (usersCount >= 17) {
      return 'g-one-twenty-fifth';
    }
  }


  disableWindowBackButton() {
    history.pushState(null, null, location.href);
    this.location.onPopState(() => {
      history.pushState(null, null, location.href);
    });
  }

  ngOnDestroy(): void {
    this.roomUsersSubscription.unsubscribe();
    this.raisedHandsSubscription.unsubscribe();
    this.updateViewSubscription.unsubscribe();
    this.roomParticipantSubscription.unsubscribe();
  }

}
