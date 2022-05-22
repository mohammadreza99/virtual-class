import {Injectable} from '@angular/core';
import {Observable, Subscription} from 'rxjs';
import {
  BaseRes,
  DisplayName,
  PeerConnection,
  PeerConnectionOptions,
  PollItem,
  Publisher,
  PublishType,
  QuestionOption,
  RoomUser,
  SearchParam,
  TrackPosition,
} from '@core/models';
import {ApiService, SocketService} from '@core/http';
import {UtilsService} from '@ng/services';
import {map} from 'rxjs/operators';
import {Router} from '@angular/router';
import {TranslationService, UpdateViewService} from '@core/utils';
import {NgMessageSeverities} from '@ng/models/overlay';
import {GlobalConfig} from '@core/global.config';

@Injectable({providedIn: 'root'})
export class SessionService extends ApiService {

  private connectionCheckerTimer: any;
  private updateRoomPublishersTimer: any;
  private updateRoomUsersTimer: any;
  private talkingTimer: any;
  private myConnection: { webcam: PeerConnection, screen: PeerConnection } = {webcam: null, screen: null};
  private peerConnections: PeerConnection[] = [];
  private publishers: Publisher[] = [];
  private roomUsers: RoomUser[] = [];
  private mainPositionUser: RoomUser;
  private socketSubscription: Subscription;
  private updateViewSubscription: Subscription;
  private isTalkingSubscription: Subscription;
  private _currentUser: any;
  private _currentRoom: any;
  private tryCounts: { [publishId: number]: number } = {};

  constructor(private utilsService: UtilsService,
              private router: Router,
              private translationService: TranslationService,
              private updateViewService: UpdateViewService,
              private socketService: SocketService) {
    super();
  }

  async initRoom() {
    this.initSockets();
    this.initViewUpdates();
    await this.updateRoomUsers();
    await this.updateRoomPublishers();
    await this.updateRoomPublicMessages();
  }

  async checkSession(roomId: number) {
    try {
      const data = await this.getRoomInfo(roomId).pipe(map(d => d.data)).toPromise();
      if (!data) {
        return;
      }
      this.currentRoom = {...data.room};
      this.currentUser = {
        ...data.user,
        role: data.member.role,
        panel_role: data.user.role,
        open_session: data.open_session,
        session: data.current_session,
      };
      if (this.currentUser.open_session) {
        const dialogRes = await this.utilsService.showConfirm({
          message: this.translationService.instant('room.openSessionConfirm') as string,
          header: this.translationService.instant('room.openSession') as string
        });
        if (dialogRes) {
          const newSession = await this.newSession().toPromise();
          this.currentUser.session = newSession.data.session;
        } else {
          await this.router.navigate(['/vc/room-info', roomId]);
        }
      }
    } catch (error) {
      console.error(error);
      throw Error(error);
    }
  }

  private async updateRoomPublishers() {
    try {
      const result = await this.roomStatus().toPromise();
      if (result.status == 'SESSION_ERROR') {
        try {
          await this.checkSession(this.currentRoom.id);
        } catch (e) {
        }
        return;
      }
      if (result.status_det == 'SessionNotExist') {
        this.peerConnections.forEach(c => {
          this.closeSubscribeConnection(c.userId, c.publishType);
        });
        await this.updateRoomPublishers();
      }
      if (result.status == 'JANUS_ERROR') {
        await this.updateRoomPublishers();
      }
      if (result.status == 'OK') {
        await this.subscribePublishers(result.data.publishers);
        this.setUpdateRoomPublishersTimer();
      }
    } catch (error) {
      console.error(error);
      this.setUpdateRoomPublishersTimer();
    }
  }

  private async updateRoomUsers() {
    try {
      const data = await this.getRoomActiveUsers().toPromise();
      const allUsers = data?.data?.items || [];
      this.roomUsers = allUsers;
      const {added, deleted} = this.getRoomUsersDifference(allUsers, this.roomUsers);
      if (added.length !== 0 || deleted.length !== 0) {
        this.roomUsers.push(...added);
        deleted?.forEach(d => {
          const index = this.roomUsers.findIndex(p => p.id === d.id);
          this.roomUsers.splice(index, 1);
        });
      }

      // by default, roomUsers not include current user, so we push self user manually.
      if (this.roomUsers.findIndex(u => u.id == this.currentUser.id) < 0) {
        this.roomUsers.unshift(this.currentUser);
      }
      this.updateViewService.setViewEvent({event: 'userContainersChange', data: this.getSortedUsers()});
      this.updateViewService.setViewEvent({event: 'raiseHandsChange', data: this.roomUsers.filter(u => u.raise_hand)});
      this.updateViewService.setViewEvent({event: 'kickedUsersChange', data: this.roomUsers.filter(u => u.kicked)});
      this.setUpdateRoomUsersTimer();
    } catch (error) {
      console.error(error);
      this.setUpdateRoomUsersTimer();
    }
  }

  async toggleMyScreen(activate: boolean): Promise<void> {
    if (this.isMainPositionBusy()) {
      return;
    }
    if (!activate) {
      await this.closeMyConnection('Screen');
      return;
    }
    const stream = await this.getUserScreen();
    const options: PeerConnectionOptions = {
      display: 'teacherScreen',
      position: 'mainPosition',
      userId: this.currentUser.id,
      publishType: 'Screen',
      stream
    };
    try {
      this.myScreen = await this.createPublishConnection(options, null);
      const videoTrack = this.myScreen.stream.getVideoTracks();
      if (videoTrack.length) {
        videoTrack[0].onended = () => {
          this.closeMyConnection(options.publishType);
        };
      }
    } catch (error) {
      console.error(error);
      this.stopStreamTrack(stream);
    }
  }

  async toggleMyAudio(activate: boolean): Promise<void> {
    try {
      const myStream = this.myWebcam?.stream;
      if (myStream?.getAudioTracks()?.length) {
        this.toggleStreamAudio(myStream, activate);
        if (!myStream.getTracks()?.find(t => t.enabled)) {
          await this.toggleShareMedia(false, 'audio');
        }
        return;
      }
      await this.toggleShareMedia(activate, 'audio');
    } catch (error) {
      console.error(error);
      if (error.name == 'NotAllowedError') {
        this.openToast('room.pleaseAllowMic', 'warn');
      }
      throw Error(error);
    }
  }

  async toggleMyVideo(activate: boolean) {
    try {
      const myStream = this.myWebcam?.stream;
      if (myStream?.getVideoTracks()?.length) {
        this.toggleStreamVideo(myStream, activate);
        if (!myStream.getTracks()?.find(t => t.enabled)) {
          await this.toggleShareMedia(false, 'video');
        }
        return;
      }
      await this.toggleShareMedia(activate, 'video');
    } catch (error) {
      console.error(error);
      if (error.name == 'NotAllowedError') {
        this.openToast('room.pleaseAllowWebcam', 'warn');
      }
      if (error.name == 'notReadableError') {
        this.openToast('errorOccurred', 'warn');
      }
      throw Error(error);
    }
  }

  async toggleShareMedia(activate: boolean, mediaType: 'audio' | 'video'): Promise<void> {
    if (!activate) {
      this.isTalkingSubscription?.unsubscribe();
      await this.closeMyConnection('Webcam');
      return;
    }
    const stream = await this.getUserMedia({audio: true, video: true});
    const display = this.imStudent || this.isMainThumbPositionBusy() ? 'studentWebcam' : 'teacherWebcam';
    const options: PeerConnectionOptions = {
      display,
      position: this.getPositionByDisplay(display),
      userId: this.currentUser.id,
      publishType: 'Webcam',
      stream
    };
    if (this.myWebcam) {
      this.myWebcam.close();
    }
    try {
      this.isTalkingSubscription = this.checkIsTalking(stream).subscribe(value => {
        if (!stream.getAudioTracks()[0].enabled) {
          return;
        }
        if (this.talkingTimer != null) {
          return;
        }
        if (value > GlobalConfig.isTalkingThreshold) {
          this.isTalking(true).toPromise();
        } else {
          this.isTalking(false).toPromise();
        }
        this.talkingTimer = setTimeout(() => {
          this.talkingTimer = null;
        }, GlobalConfig.isTalkingCheckDelay);
      });
      this.myWebcam = await this.createPublishConnection(options, mediaType);
      const videoTrack = this.myWebcam.stream.getVideoTracks();
      if (videoTrack.length) {
        videoTrack[0].onended = () => {
          this.closeMyConnection(options.publishType);
        };
      }
    } catch (error) {
      console.error(error);
      this.stopStreamTrack(stream);
      throw Error(error);
    }
  }

  private createSubscribeConnection(options: PeerConnectionOptions) {
    return new PeerConnection({
      userId: options.userId,
      publishId: options.publishId,
      display: options.display,
      position: options.position,
      publishType: options.publishType,
      getRemoteOfferSdp: () => {
        return this.joinAsSubscriber(this.currentRoom.id, options.publishId).toPromise();
      },
      startSubscription: (sdp: string) => {
        return this.startSubscription(sdp, options.publishId).toPromise();
      },
      onTrack: (event: RTCTrackEvent) => {
        if (options.position == 'mainThumbPosition') {
          this.setMainPositionUser(options.userId);
        }
        this.updateViewService.setViewEvent({
          event: 'onTrack',
          data: {
            stream: event.streams[0],
            userId: options.userId,
            display: options.display,
            position: options.position,
            publishType: options.publishType,
          }
        });
      },
      onConnect: () => {
      },
      onDisconnect: () => {
        this.closeSubscribeConnection(options.userId, options.publishType);
      },
      onFailed: (reason: string) => {
        this.closeSubscribeConnection(options.userId, options.publishType);
        if (options.userId == this.currentUser.id) {
          this.resetAll();
          this.initRoom();
        }
      },
      onClose: () => {
      }
    });
  }

  private async createPublishConnection(options: PeerConnectionOptions, mediaType: 'audio' | 'video') {
    return new Promise<PeerConnection>((resolve, reject) => {
      const pc = new PeerConnection({
        userId: options.userId,
        display: options.display,
        position: options.position,
        stream: options.stream,
        publishType: options.publishType,
        getRemoteAnswerSdp: (offerSdp: string) => {
          return this.joinAsPublisher(this.currentRoom.id, offerSdp, options.display, options.publishType).toPromise();
        },
        publishConfirm: () => {
          return this.newPublisher(options.publishType).toPromise();
        },
        onTrack: () => {
          if (options.position == 'mainThumbPosition') {
            this.setMainPositionUser(options.userId);
          }
          this.updateViewService.setViewEvent({
            event: 'onTrack',
            data: {
              stream: options.stream,
              userId: options.userId,
              display: options.display,
              position: options.position,
              publishType: options.publishType,
            }
          });
          resolve(pc);
        },
        onConnect: () => {
        },
        onDisconnect: () => {
          if (this.mainPositionUser?.id == options.userId) {
            this.removeMainPositionUser();
          }
          this.closeMyConnection(options.publishType, true);
        },
        onFailed: (reason: string) => {
        },
        onClose: () => {
        }
      });
      pc.createPublishConnection(mediaType);
    });
    // return pc;
  }

  private async connectionChecker(publishers: Publisher[]) {
    if (this.connectionCheckerTimer) {
      clearTimeout(this.connectionCheckerTimer);
    }
    const added = publishers.filter(b => this.peerConnections.findIndex(s => s.publishId === b.id) < 0);
    if (added.length === 0) {
      return;
    }
    for (const publisher of added) {
      let tryCount = this.tryCounts[publisher.id] || 0;
      if (tryCount >= 5) {
        continue;
      }
      this.tryCounts[publisher.id] = ++tryCount;

      if (this.roomUsers.findIndex(u => u.id == publisher.user_id) > -1) {
        const display: DisplayName = publisher.display;
        const position: TrackPosition = this.getPositionByDisplay(publisher.display);
        const publishId: any = publisher.id;
        const publishType: any = publisher.publish_type;
        const userId: any = publisher.user_id;
        const newPC = await this.createSubscribeConnection({publishId, userId, display, position, publishType});
        this.peerConnections.push(newPC);
        newPC.startSubscribeConnection();
      }
    }

    this.connectionCheckerTimer = setTimeout(() => {
      this.connectionChecker(publishers);
    }, 10000);
    this.updateViewService.setViewEvent({event: 'userContainersChange', data: this.getSortedUsers()});
  }

  private async subscribePublishers(publishers: Publisher[]) {
    this.publishers = publishers;
    const deleted = this.peerConnections.filter(s => publishers.findIndex(b => b.id === s.publishId) < 0);
    if (deleted.length) {
      deleted.forEach(d => {
        this.closeSubscribeConnection(d.userId, d.publishType);
      });
      this.updateViewService.setViewEvent({event: 'userContainersChange', data: this.getSortedUsers()});
    }
    this.connectionChecker(publishers);
  }

  private async closeMyConnection(publishType: PublishType, locally?: boolean) {
    const myConnection: PeerConnection = this.myConnection[publishType.toLowerCase()];
    const myStream = myConnection?.stream;
    if (!myStream || !myConnection) {
      return;
    }
    this.stopStreamTrack(myStream);
    myConnection.close();
    this.updateViewService.setViewEvent({
      event: 'onDisconnect',
      data: {
        userId: myConnection.userId,
        display: myConnection.display,
        position: myConnection.position,
        publishType: myConnection.publishType,
      }
    });
    this.myConnection[publishType.toLowerCase()] = null;
    if (!locally) {
      const data = await this.unPublish(publishType).toPromise();
      if (data.status != 'OK') {
        throw Error('unPublish error');
      }
    }
  }

  private closeSubscribeConnection(userId: any, publishType: PublishType) {
    const index = this.peerConnections.findIndex(pc => pc.userId == userId && pc.publishType == publishType);
    if (index > -1) {
      const connection = this.peerConnections[index];
      connection.close();
      this.peerConnections.splice(index, 1);
      this.updateViewService.setViewEvent({
        event: 'onDisconnect',
        data: {
          userId: connection.userId,
          publishType: connection.publishType,
          display: connection.display,
          position: connection.position,
        }
      });
    }
  }

  private setUpdateRoomPublishersTimer(timer: number = GlobalConfig.updateRoomPublishersDelay) {
    if (this.updateRoomPublishersTimer) {
      clearTimeout(this.updateRoomPublishersTimer);
    }
    this.updateRoomPublishersTimer = setTimeout(() => {
      this.updateRoomPublishers();
    }, timer);
  }

  private setUpdateRoomUsersTimer(timer: number = GlobalConfig.updateRoomUsersDelay) {
    if (this.updateRoomUsersTimer) {
      clearTimeout(this.updateRoomUsersTimer);
    }
    this.updateRoomUsersTimer = setTimeout(() => {
      this.updateRoomUsers();
    }, timer);
  }

  private removeMainPositionUser() {
    if (this.mainPositionUser) {
      this.mainPositionUser = null;
      this.updateViewService.setViewEvent({event: 'userContainersChange', data: this.getSortedUsers()});
    }
  }

  private setMainPositionUser(userId: any) {
    this.mainPositionUser = this.getRoomUserById(userId);
    this.updateViewService.setViewEvent({event: 'userContainersChange', data: this.getSortedUsers()});
  }

  private getSortedUsers() {
    this.updateViewService.setViewEvent({event: 'roomParticipantsChange', data: this.roomUsers});
    let sortedUsers = [...this.roomUsers.filter(u => !u.kicked)];
    const meIndex = sortedUsers.findIndex(u => u.id == this.currentUser.id);
    const me = sortedUsers[meIndex];
    sortedUsers.splice(meIndex, 1);

    const admins = sortedUsers.filter(u => u.role == 'Admin');
    const others = sortedUsers.filter(u => u.role != 'Admin');

    sortedUsers = [me, ...this.sortByPublishers(admins), ...this.sortByPublishers(others)];
    if (this.mainPositionUser) {
      const idx = sortedUsers.findIndex(u => u.id == this.mainPositionUser.id);
      sortedUsers.splice(idx, 1);
    }
    return sortedUsers;
  }

  private initSockets() {
    this.socketService.start(this.currentRoom.id);
    this.socketSubscription = this.socketService.listen().subscribe(async res => {
      console.log(`${res.event} => `, res);
      let user: RoomUser;
      let raiseHandUser: RoomUser;
      let connection: PeerConnection;

      switch (res.event) {
        case 'newUser':
          user = res.user;
          if (res.target != this.currentUser.id && this.roomUsers.findIndex(u => u.id == user.id) < 0) {
            this.roomUsers.push(user);
            this.updateViewService.setViewEvent({event: 'userContainersChange', data: this.getSortedUsers()});
          }
          raiseHandUser = this.roomUsers.find(u => u.id === user.id);
          if (raiseHandUser && user.raise_hand !== raiseHandUser.raise_hand) {
            raiseHandUser.raise_hand = user.raise_hand;
            this.updateViewService.setViewEvent({
              event: 'raiseHandsChange',
              data: this.roomUsers.filter(u => u.raise_hand)
            });
          }
          this.setUpdateRoomPublishersTimer(2000);
          break;

        case 'newPublisher':
          const publisher = this.publishers.find(p => p.user_id == res.target);
          if (publisher) {
            this.tryCounts[publisher.id] = 0;
          }
          this.setUpdateRoomPublishersTimer(2000);
          break;

        case 'unpublish':
          if (this.mainPositionUser?.id == res.target && res.publish_type == 'Webcam') {
            this.removeMainPositionUser();
          }
          if (this.currentUser.id != res.target) {
            this.closeSubscribeConnection(res.target, res.publish_type);
          }
          break;

        case 'closeRoom':
          this.getMeOut();
          break;

        case 'kickUser':
          user = this.getRoomUserById(res.target);
          if (res.target == this.currentUser.id) {
            this.getMeOut(this.translationService.instant('room.yourKicked') as string);
          } else {
            raiseHandUser = this.roomUsers.find(p => p.id == res.target);
            const userIndex = this.roomUsers.findIndex(u => u.id == res.target);
            if (raiseHandUser) {
              raiseHandUser.raise_hand = false;
              this.updateViewService.setViewEvent({
                event: 'raiseHandsChange',
                data: this.roomUsers.filter(u => u.raise_hand)
              });
            }
            this.roomUsers[userIndex].kicked = true;
            this.updateViewService.setViewEvent({event: 'userContainersChange', data: this.getSortedUsers()});
            this.updateViewService.setViewEvent({
              event: 'kickedUsersChange',
              data: this.roomUsers.filter(u => u.kicked)
            });
            this.openToast('room.userKicked', 'warn', user.last_name);
          }
          break;

        case 'userDisconnected':
        case 'leaveRoom':
          user = this.getRoomUserById(res.target);
          if (res.target != this.currentUser.id) {
            connection = this.getPeerConnectionById(res.target);
            if (connection) {
              this.closeSubscribeConnection(res.target, connection.publishType);
            }
            const idx = this.roomUsers.findIndex(p => p.id == res.target);
            if (idx > -1) {
              this.roomUsers.splice(idx, 1);
            }
            if (this.mainPositionUser?.id == res.target) {
              this.removeMainPositionUser();
            }
            this.updateViewService.setViewEvent({event: 'userContainersChange', data: this.getSortedUsers()});
            raiseHandUser = this.roomUsers.find(p => p.id == res.target);
            if (raiseHandUser) {
              raiseHandUser.raise_hand = false;
              this.updateViewService.setViewEvent({
                event: 'raiseHandsChange',
                data: this.roomUsers.filter(u => u.raise_hand)
              });
            }
          }
          if (res.event == 'leaveRoom') {
            if (res.target == this.currentUser.id) {
              this.getMeOut();
            } else if (res.target != this.currentUser.id && this.imTeacher) {
              if (user) {
                this.openToast('room.userLeftTheRoom', 'warn', user.last_name);
              }
            }
          }
          break;

        case 'raiseHand':
          user = this.getRoomUserById(res.target);
          raiseHandUser = this.roomUsers.find(u => u.id == res.target);
          if (res.by == res.target) {
            // hand raise occur by student
            raiseHandUser.raise_hand = res.value;
            if (res.value) {
              if (this.imTeacher) {
                this.openToast('room.userRaisedHand', 'warn', user.last_name);
              }
            }
            this.updateViewService.setViewEvent({event: 'studentRaisedHand', data: res});
          } else {
            // hand raise occur by teacher
            if (!res.value) {
              // the teacher reject student raise hand
              raiseHandUser.raise_hand = false;
              if (this.imStudent && res.target == this.currentUser.id) {
                this.openToast('room.teacherRejectYourRaiseHand', 'warn', user.last_name);
              }
            }
            this.updateViewService.setViewEvent({event: 'teacherConfirmRaisedHand', data: res});
          }
          this.updateViewService.setViewEvent({
            event: 'raiseHandsChange',
            data: this.roomUsers.filter(u => u.raise_hand)
          });
          break;

        case 'mutePerson':
          user = this.getRoomUserById(res.target);
          user.muted = res.value;
          if (this.currentUser.id == res.target) {
            if (res.value) {
              this.openToast('room.yourVoiceAccessIsClosed', 'warn');
              this.toggleMyAudio(false);
            } else {
              this.openToast('room.yourVoiceAccessIsOpened', 'warn');
            }
            this.updateViewService.setViewEvent({event: 'mutePerson', data: res});
          }
          break;

        case 'muteVideo':
          user = this.getRoomUserById(res.target);
          user.muted_video = res.value;
          if (this.currentUser.id == res.target) {
            if (res.value) {
              this.openToast('room.yourVideoAccessIsClosed', 'warn');
              this.toggleMyVideo(false);
            } else {
              this.openToast('room.yourVideoAccessIsOpened', 'warn');
            }
            this.updateViewService.setViewEvent({event: 'muteVideo', data: res});
          }
          break;

        case 'muteAll':
          this.roomUsers.forEach(p => {
            if (p.role != 'Admin') {
              p.muted = res.value;
            }
          });
          if (this.imStudent) {
            if (res.value) {
              this.openToast('room.yourVoiceAccessIsClosed', 'warn');
              this.toggleMyAudio(false);
            } else {
              this.openToast('room.yourVoiceAccessIsOpened', 'warn');
            }
            this.updateViewService.setViewEvent({event: 'muteAll', data: res});
          }
          break;

        case 'muteVideoAll':
          this.roomUsers.forEach(p => {
            if (p.role != 'Admin') {
              p.muted_video = res.value;
            }
          });
          if (this.imStudent) {
            if (res.value) {
              this.openToast('room.yourVideoAccessIsClosed', 'warn');
              this.toggleMyVideo(false);
            } else {
              this.openToast('room.yourVideoAccessIsOpened', 'warn');
            }
            this.updateViewService.setViewEvent({event: 'muteVideoAll', data: res});
          }
          break;

        case 'assignAdmin':
          if (this.currentUser.id == res.target) {
            this.utilsService.showConfirm({
              message: this.translationService.instant('room.myRoleChangedConfirm') as string,
              header: this.translationService.instant('room.roleChanged') as string
            }).then(dialogRes => {
              if (dialogRes) {
                document.location.reload();
              }
            });
          }
          break;

        case 'finishedQuestion':
          if (this.imStudent) {
            this.openToast('room.questionFinished', 'warn');
          }
          this.updateViewService.setViewEvent({event: 'finishedQuestion', data: res});
          break;

        case 'canceledQuestion':
          if (this.imStudent) {
            this.openToast('room.questionCanceled', 'warn');
          }
          this.updateViewService.setViewEvent({event: 'canceledQuestion', data: res});
          break;


        case 'finishedPoll':
          if (this.imStudent) {
            this.openToast('room.pollFinished', 'warn');
          }
          this.updateViewService.setViewEvent({event: 'finishedPoll', data: res});
          break;

        case 'canceledPoll':
          if (this.imStudent) {
            this.openToast('room.pollCanceled', 'warn');
          }
          this.updateViewService.setViewEvent({event: 'canceledPoll', data: res});
          break;

        case 'randomUser':
          if (this.imStudent && res.target == this.currentUser.id) {
            this.openToast('room.youHaveBeenSelected', 'warn', null, true);
          } else if (this.imStudent && res.target != this.currentUser.id) {
            this.openToast('room.anotherUserSelected', 'warn', res.user.first_name + ' ' + res.user.last_name);
          }
          break;

        case 'restoreUser':
          const kickedUser = this.roomUsers.find(u => u.id == res.target);
          if (kickedUser) {
            kickedUser.kicked = false;
          }
          this.updateViewService.setViewEvent({event: 'restoreUser', data: res});
          this.updateViewService.setViewEvent({event: 'kickedUsersChange', data: this.roomUsers.filter(u => u.kicked)});
          break;

        case 'newMedia':
          if (this.currentUser.id != res.target) {
            return;
          }
          const {p_type, feed, sdp, publish_type} = res;

          // subscribe
          if (p_type == 'offer') {
            connection = this.peerConnections.find(c => c.publishId == feed);
            connection.setRemoteOffer(sdp);
          }

          // publish
          if (p_type == 'answer') {
            // if (publish_type.toLowerCase() == 'webcam') {
            //   connection = this.myConnection.webcam;
            // } else {
            //   connection = this.myConnection.screen;
            // }
            // connection.setRemoteAnswer(sdp);
            this.updateViewService.setViewEvent({event: 'remoteAnswer', data: {sdp}});
          }
          break;

        default:
          this.updateViewService.setViewEvent({event: res.event, data: res});
          break;
      }
    });
  }

  private initViewUpdates() {
    this.updateViewSubscription = this.updateViewService.getViewEvent().subscribe(async (res: any) => {
      switch (res.event) {
        case 'networkIssue':
          this.utilsService.showToast({
            detail: this.translationService.instant('room.networkIssueDetected') as string,
            severity: 'warn'
          });
          await this.getMeOut(null, false);
          this.router.navigate(['/vc/room-info', this.currentRoom.id]);
          document.location.reload();
          break;

        case 'socketFail':
          break;
      }
    });
  }

  private isMainPositionBusy() {
    return this.peerConnections.findIndex(c => c.position == 'mainPosition') >= 0;
  }

  private isMainThumbPositionBusy() {
    return !!this.mainPositionUser || this.peerConnections.findIndex(c => c.position == 'mainThumbPosition') >= 0;
  }

  private async updateRoomPublicMessages() {
    const result = await this.getPublicMessages().toPromise();
    if (result.status == 'OK') {
      this.updateViewService.setViewEvent({event: 'publicMessagesChange', data: result.data.items.reverse()});
    }
  }

  async getRandomUser() {
    const availableUsers = this.roomUsers.filter(u => u.role != 'Admin');
    if (availableUsers.length == 0) {
      return;
    }
    const randomIndex = Math.floor(Math.random() * availableUsers.length);
    return availableUsers[randomIndex];
  }

  private resetAll() {
    this.roomUsers = [];
    this.peerConnections = [];
    this.removeMainPositionUser();
  }

  set currentUser(data: any) {
    this._currentUser = data;
  }

  get currentUser() {
    return this._currentUser;
  }

  set currentRoom(data: any) {
    this._currentRoom = data;
  }

  get currentRoom() {
    return this._currentRoom;
  }

  get imStudent(): boolean {
    return this.currentUser.role == 'Viewer';
  }

  get imTeacher(): boolean {
    return this.currentUser.role == 'Admin';
  }

  private getPositionByDisplay(display: DisplayName): TrackPosition {
    switch (display) {
      case 'teacherWebcam':
        return 'mainThumbPosition';
      case 'teacherScreen':
        return 'mainPosition';
      case 'studentWebcam':
      default:
        return 'sideThumbPosition';
    }
  }

  private set myScreen(v: PeerConnection) {
    this.myConnection.screen = v;
  }

  private get myScreen() {
    return this.myConnection.screen;
  }

  private set myWebcam(v: PeerConnection) {
    this.myConnection.webcam = v;
  }

  private get myWebcam() {
    return this.myConnection.webcam;
  }

  private getPeerConnectionById(publishId: any) {
    return this.peerConnections.find(c => c.userId == publishId);
  }

  getRoomUserById(id: any) {
    return this.roomUsers.find(u => u.id == id);
  }

  checkIsTalking(stream: MediaStream) {
    return new Observable<number>(observer => {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      const javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);
      analyser.smoothingTimeConstant = 0.8;
      analyser.fftSize = 1024;
      microphone.connect(analyser);
      analyser.connect(javascriptNode);
      javascriptNode.connect(audioContext.destination);
      javascriptNode.onaudioprocess = () => {
        const array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        let values = 0;
        const length = array.length;
        for (let i = 0; i < length; i++) {
          values += (array[i]);
        }
        const average = values / length;
        observer.next(average);
      };
    });
  }

  async getMeOut(message?: any, reload: boolean = true) {
    if (this.myConnection.webcam) {
      this.stopStreamTrack(this.myConnection.webcam.stream);
    } else if (this.myConnection.screen) {
      this.stopStreamTrack(this.myConnection.screen.stream);
    }
    if (this.updateRoomPublishersTimer) {
      clearInterval(this.updateRoomPublishersTimer);
    }
    if (this.updateRoomUsersTimer) {
      clearInterval(this.updateRoomUsersTimer);
    }
    this.socketService.clearPingTimer();
    this.socketService.stop();
    this.socketSubscription?.unsubscribe();
    if (message) {
      await this.utilsService.showDialog({message, closable: false});
    }
    if (reload) {
      document.location.reload();
    }
  }

  getProfileColor(userId: number) {
    const colors = {
      0: '#5643C1',
      1: '#FF7170',
      2: '#FEC144',
      3: '#AFC0C9',
      4: '#39A78E',
      5: '#CA4957',
      6: '#70CCFF',
      7: '#FFAC70',
      8: '#E2619B',
      9: '#018591',
    };
    const id = userId.toString();
    const lastChar = id.length > 1 ? id[id.length - 1] : id;
    return colors[lastChar];
  }

  openToast(translateKey: string, severity: NgMessageSeverities = 'error', translateValue: any = null, sticky?: boolean) {
    this.utilsService.showToast({
      detail: this.translationService.instant(translateKey, {value: translateValue}) as string || translateKey,
      severity,
      sticky: sticky || false
    });
  }

  hasVideo(stream: MediaStream) {
    if (!stream) {
      return false;
    }
    return stream.getVideoTracks().findIndex(t => t.enabled) >= 0;
  }

  getRoomUsers() {
    return this.roomUsers;
  }

  hasAudio(stream: MediaStream) {
    if (!stream) {
      return false;
    }
    return stream.getAudioTracks().findIndex(t => t.enabled) >= 0;
  }

  private toggleStreamAudio(stream: MediaStream, activate: boolean) {
    if (!stream) {
      return;
    }
    const tracks = stream.getAudioTracks();
    tracks.forEach(t => {
      t.enabled = activate;
    });
  }

  private toggleStreamVideo(stream: MediaStream, activate: boolean) {
    if (!stream) {
      return;
    }
    const tracks = stream.getVideoTracks();
    tracks.forEach(t => {
      t.enabled = activate;
    });
  }

  private stopStreamTrack(stream: MediaStream) {
    if (!stream) {
      return;
    }
    stream.getTracks().forEach(t => t.stop());
  }

  private isPublisher(user: RoomUser) {
    return this.peerConnections.findIndex(c => c.userId == user.id) >= 0;
  }

  getUserMedia(options: MediaStreamConstraints = {audio: true, video: true}) {
    const navigator2 = navigator as any;
    navigator2.getWebcam = (navigator2.getUserMedia || navigator2.webKitGetUserMedia || navigator2.moxGetUserMedia || navigator2.mozGetUserMedia || navigator2.msGetUserMedia);
    if (navigator.mediaDevices.getUserMedia) {
      return navigator.mediaDevices.getUserMedia(options);
    } else {
      return navigator2.getWebcam(options);
    }
  }

  private getUserScreen(): Promise<MediaStream> {
    return (navigator.mediaDevices as any).getDisplayMedia({audio: false});
  }

  getRoomUsersDifference(base: RoomUser[], secondary: RoomUser[]) {
    if (!base || !secondary) {
      return;
    }
    const added = base.filter(b => secondary.findIndex(s => s.id === b.id) < 0);
    const deleted = secondary.filter(s => base.findIndex(b => b.id === s.id) < 0);
    return {added, deleted};
  }

  private sortByPublishers(users: RoomUser[]) {
    const isPublishers = [];
    const isNotPublishers = [];
    users.forEach(u => {
      if (this.isPublisher(u)) {
        isPublishers.push(u);
      } else {
        isNotPublishers.push(u);
      }
    });
    return isPublishers.concat(isNotPublishers);
  }

  ///////////////////////////////////////////////////////////////////////////////
  //                                API CALLS                                  //
  ///////////////////////////////////////////////////////////////////////////////

  //region Api Calls
  updateBoard(board_id: number, slide_no: number, data: any) {
    return this._post<any>('', {
      method: 'updateBoard',
      data: {board_id, room_id: this.currentRoom.id, slide_no, data},
    });
  }

  openBoard(is_downloadable: boolean) {
    return this._post<any>('', {
      method: 'openBoard',
      data: {is_downloadable, room_id: this.currentRoom.id},
    });
  }

  closeBoard() {
    return this._post<any>('', {
      method: 'closeBoard',
      data: {room_id: this.currentRoom.id},
    });
  }

  changeBoardSlide(board_id: number, slide_no: number) {
    return this._post<any>('', {
      method: 'changeBoardSlide',
      data: {board_id, room_id: this.currentRoom.id, slide_no},
    });
  }

  getBoard(board_id: number) {
    return this._post<any>('', {
      method: 'getBoard',
      data: {board_id, room_id: this.currentRoom.id},
    });
  }

  setBoardPermission(board_id: number, user_id: number) {
    return this._post<any>('', {
      method: 'setBoardPermission',
      data: {user_id, room_id: this.currentRoom.id, board_id},
    });
  }

  removeBoardPermission(board_id: number, user_id: number) {
    return this._post<any>('', {
      method: 'removeBoardPermission',
      data: {user_id, room_id: this.currentRoom.id, board_id},
    });
  }

  muteUser(user_id: number, mute: boolean) {
    return this._post<any>('', {
      method: 'mutePerson',
      data: {user_id, room_id: this.currentRoom.id, mute},
    });
  }

  muteAll(mute: boolean) {
    return this._post<any>('', {method: 'muteAll', data: {room_id: this.currentRoom.id, mute}});
  }

  muteUserVideo(user_id: number, mute: boolean) {
    return this._post<any>('', {
      method: 'muteVideo',
      data: {user_id, room_id: this.currentRoom.id, mute},
    });
  }

  muteVideoAll(mute: boolean) {
    return this._post<any>('', {method: 'muteVideoAll', data: {room_id: this.currentRoom.id, mute}});
  }

  leaveRoom() {
    return this._post<any>('', {method: 'leaveRoom', data: {room_id: this.currentRoom.id}});
  }

  closeRoom() {
    return this._post<any>('', {method: 'closeRoom', data: {room_id: this.currentRoom.id}});
  }

  kickUser(user_id: number, kick_time?: number) {
    return this._post<any>('', {method: 'kickUser', data: {user_id, kick_time, room_id: this.currentRoom.id}});
  }

  raiseHand(raise_hand: boolean) {
    return this._post<any>('', {
      method: 'raiseHand',
      data: {room_id: this.currentRoom.id, raise_hand},
    });
  }

  acceptRaiseHand(user_id: number) {
    return this._post<any>('', {
      method: 'raiseHand',
      data: {room_id: this.currentRoom.id, raise_hand: true, user_id},
    });
  }

  rejectRaiseHand(user_id: number) {
    return this._post<any>('', {
      method: 'raiseHand',
      data: {room_id: this.currentRoom.id, raise_hand: false, user_id},
    });
  }

  getRoomActiveUsers() {
    return this._post<any>('', {method: 'getRoomActiveUsers', data: {room_id: this.currentRoom.id}});
  }

  unPublish(publish_type: PublishType) {
    return this._post<any>('', {
      method: 'unpublish',
      data: {room_id: this.currentRoom.id, publish_type, session: this.currentUser.session},
    });
  }

  userEnterStatus(room_id: number) {
    return this._post<any>('', {
      method: 'userEnterStatus',
      data: {room_id},
    });
  }

  newSession() {
    return this._post<any>('', {
      method: 'newSession',
      data: {room_id: this.currentRoom.id}
    });
  }

  restoreKickedUser(user_id: number) {
    return this._post<any>('', {method: 'restoreKickedUser', data: {room_id: this.currentRoom.id, user_id}});
  }

  getRoomInfo(room_id: number) {
    return this._post<any>('', {method: 'getRoomInfo', data: {room_id}});
  }

  newPublisher(publish_type: PublishType) {
    return this._post<any>('', {
      method: 'newPublisher',
      data: {room_id: this.currentRoom.id, publish_type, session: this.currentUser.session},
    });
  }

  sendPublicMessage(message: string, reply_to_message_id: number = null): any {
    return this._post<any>('', {
      method: 'sendPublicMessage',
      data: {room_id: this.currentRoom.id, message, reply_to_message_id},
    });
  }

  changePublicChatState(state: boolean): any {
    return this._post<any>('', {
      method: 'changePublicChatState',
      data: {room_id: this.currentRoom.id, state},
    });
  }

  deletePublicMessage(message_id: number) {
    return this._post<any>('', {
      method: 'deletePublicMessage',
      data: {message_id},
    });
  }

  muteUserMessage(user_id: number) {
    return this._post<any>('', {
      method: 'muteUserMessage',
      data: {room_id: this.currentRoom.id, user_id},
    });
  }

  clearPublicMessages() {
    return this._post<any>('', {
      method: 'clearPublicMessage',
      data: {room_id: this.currentRoom.id},
    });
  }

  isTalking(talking: boolean) {
    return this._post<any>('', {
      method: 'isTalking',
      data: {room_id: this.currentRoom.id, talking},
    });
  }

  addQuestion(description: string, options: QuestionOption) {
    return this._post<any>('', {
      method: 'addQuestion',
      data: {room_id: this.currentRoom.id, description, state: 'InProgress', options},
    });
  }

  getQuestionById(question_id: number) {
    return this._post<any>('', {
      method: 'getQuestion',
      data: {room_id: this.currentRoom.id, question_id},
    });
  }

  getQuestionSelfReplies(question_id: number) {
    return this._post<any>('', {
      method: 'getQuestionSelfReplies',
      data: {room_id: this.currentRoom.id, question_id},
    });
  }

  getArchivedQuestions() {
    return this._post<any>('', {
      method: 'getArchivedQuestions',
      data: {room_id: this.currentRoom.id},
    });
  }

  getQuestionResult(question_id: number) {
    return this._post<any>('', {
      method: 'getQuestionResult',
      data: {room_id: this.currentRoom.id, question_id},
    });
  }

  getQuestionOptionReplies(question_option_id: number) {
    return this._post<any>('', {
      method: 'getQuestionOptionReplies',
      data: {room_id: this.currentRoom.id, question_option_id},
    });
  }

  changeQuestionPublishState(question_id: number, state: string) {
    return this._post<any>('', {
      method: 'changeQuestionPublishState',
      data: {room_id: this.currentRoom.id, question_id, state},
    });
  }

  replyQuestion(question_id: number, replies: { question_option_id }[]) {
    return this._post<any>('', {
      method: 'replyQuestion',
      data: {room_id: this.currentRoom.id, question_id, replies},
    });
  }

  addPoll(poll: PollItem) {
    return this._post<any>('', {
      method: 'addPoll',
      data: {room_id: this.currentRoom.id, state: 'InProgress', ...poll},
    });
  }

  getPollById(poll_id: number) {
    return this._post<any>('', {
      method: 'getPoll',
      data: {room_id: this.currentRoom.id, poll_id},
    });
  }

  getArchivedPolls() {
    return this._post<any>('', {
      method: 'getArchivedPolls',
      data: {room_id: this.currentRoom.id},
    });
  }

  getPollResult(poll_id: number) {
    return this._post<any>('', {
      method: 'getPollResult',
      data: {room_id: this.currentRoom.id, poll_id},
    });
  }

  changePollPublishState(poll_id: number, state: string) {
    return this._post<any>('', {
      method: 'changePollPublishState',
      data: {room_id: this.currentRoom.id, poll_id, state},
    });
  }

  replyPoll(poll_id: number, replies: { poll_option_id }[]) {
    return this._post<any>('', {
      method: 'submitPoll',
      data: {room_id: this.currentRoom.id, poll_id, replies},
    });
  }

  exportSessionAttendance() {
    return this._post<any>('', {
      method: 'exportSessionAttendance',
      data: {room_id: this.currentRoom.id},
    });
  }

  getPresentationPolicy(file_name: string, is_downloadable: boolean) {
    return this._post<any>('', {
      method: 'getPresentationUploadForm',
      data: {room_id: this.currentRoom.id, file_name, is_downloadable},
    });
  }

  uploadPresentation(url: string, policy: any) {
    const formData = new FormData();
    for (const key in policy) {
      if (key == 'main_url') {
        continue;
      }
      formData.append(key, policy[key]);
    }
    return this.http.post(url, formData);
  }

  changePresentationPage(presentation_id: number, page: number) {
    return this._post<any>('', {
      method: 'changePresentationPage',
      data: {room_id: this.currentRoom.id, presentation_id, page},
    });
  }

  changePresentationState(presentation_id: number, state: 'Open' | 'Close') {
    return this._post<any>('', {
      method: 'changePresentationState',
      data: {room_id: this.currentRoom.id, presentation_id, state},
    });
  }

  deletePresentation(presentation_id: number) {
    return this._post<any>('', {
      method: 'deletePresentation',
      data: {room_id: this.currentRoom.id, presentation_id},
    });
  }

  getUploadStatus(presentation_id: number) {
    return this._post<any>('', {
      method: 'getUploadStatus',
      data: {room_id: this.currentRoom.id, presentation_id},
    });
  }

  getActivePresentations() {
    return this._post<any>('', {
      method: 'getActivePresentations',
      data: {room_id: this.currentRoom.id, limit: 10},
    });
  }

  uploadPresentationCompleted(presentation_id: number) {
    return this._post<any>('', {
      method: 'presentationUploadCompleted',
      data: {room_id: this.currentRoom.id, presentation_id},
    });
  }

  getUserUploadLink(user_id: number): Observable<BaseRes<any>> {
    return this._post('', {method: 'uploadUserAvatar', data: {user_id}});
  }

  uploadUserAvatar(url: string, image: File): Observable<BaseRes<any>> {
    return this.http.put<any>(url, image);
  }

  deleteUserAvatar(user_id: number): Observable<BaseRes<any>> {
    return this._post('', {method: 'deleteUserAvatar', data: {user_id}});
  }

  selectRandomUser(user_id: number): Observable<BaseRes<any>> {
    return this._post('', {method: 'selectRandomUser', data: {room_id: this.currentRoom.id, user_id}});
  }

  videoAction(action: string) {
    return this._post('', {method: 'videoAction', data: {room_id: this.currentRoom.id, action}});
  }

  uploadVideoLink(link: number, is_downloadable: boolean = false) {
    return this._post('', {method: 'presentLink', data: {room_id: this.currentRoom.id, link, is_downloadable}});
  }

  openPV(user_id: number): Observable<BaseRes<any>> {
    return this._post('', {method: 'openPV', data: {room_id: this.currentRoom.id, user_id}});
  }

  sendPVMessage(pv_id: number, message: string, reply_to_message_id: number = null): Observable<BaseRes<any>> {
    return this._post('', {
      method: 'sendPVMessage',
      data: {room_id: this.currentRoom.id, pv_id, reply_to_message_id, message}
    });
  }

  getPVMessage(pv_id: number, page?: number, limit?: number) {
    return this._post('', {method: 'getPVMessage', data: {room_id: this.currentRoom.id, pv_id, page, limit}});
  }

  pinPublicMessage(message_id: number) {
    return this._post<any>('', {
      method: 'pinPublicMessage',
      data: {room_id: this.currentRoom.id, message_id},
    });
  }

  private getPublicMessages(data: SearchParam | {} = {}) {
    return this._post<any>('', {
      method: 'getPublicMessages',
      data: {room_id: this.currentRoom.id, ...data},
    });
  }

  private roomStatus() {
    return this._post<any>('', {
      method: 'roomStatus',
      data: {room_id: this.currentRoom.id, session: this.currentUser.session}
    });
  }

  private joinAsSubscriber(room_id: number, publisher_id: number) {
    return this._post<any>('', {
      method: 'joinSubscriber',
      data: {room_id, publisher_id, session: this.currentUser.session}
    });
  }

  private startSubscription(sdp_answer_data: string, publisher_id: number) {
    return this._post<any>('', {
      method: 'startSubscription',
      data: {sdp_answer_data, publisher_id, room_id: this.currentRoom.id, session: this.currentUser.session}
    });
  }

  private joinAsPublisher(room_id: number, sdp_offer_data: string, tag: DisplayName, publish_type: PublishType) {
    return this._post<any>('', {
      method: 'joinPublisher',
      data: {sdp_offer_data, tag, room_id, publish_type, session: this.currentUser.session}
    });
  }

  //endregion
}
