import {Injectable} from '@angular/core';
import {Subscription} from 'rxjs';
import {
  DeviceType,
  DisplayName,
  PeerConnection,
  PeerConnectionOptions,
  Publisher,
  PublishType,
  RoomUser,
  SearchParam,
  TrackPosition
} from '@core/models';
import {ApiService, SocketService} from '@core/http';
import {UtilsService} from '@ng/services';
import {map} from 'rxjs/operators';
import {Router} from '@angular/router';
import {TranslationService} from '@core/utils';
import {UpdateViewService} from '@core/http/update-view.service';
import {NgMessageSeverities} from '@ng/models/overlay';
import {GlobalConfig} from '../../global.config';

@Injectable({providedIn: 'root'})
export class SessionService extends ApiService {

  private updateRoomPublishersTimer: any;
  private updateRoomUsersTimer: any;
  private talkingTimer: any;
  private myConnection: { webcam: PeerConnection, screen: PeerConnection } = {webcam: null, screen: null};
  private peerConnections: PeerConnection[] = [];
  private roomUsers: RoomUser[] = [];
  private raisedHands: RoomUser[] = [];
  private mainPositionUser: RoomUser;
  private socketSubscription: Subscription;
  private _currentUser: any;
  private _currentRoom: any;

  constructor(private utilsService: UtilsService,
              private router: Router,
              private translationService: TranslationService,
              private updateViewService: UpdateViewService,
              private socketService: SocketService) {
    super();
  }

  ///////////////////////////////////////////////////////////////////////////////
  //                                    MAIN                                   //
  ///////////////////////////////////////////////////////////////////////////////
  async initRoom() {
    await this.checkConnectedDevices();
    await this.updateRoomUsers();
    await this.updateRoomPublishers();
    await this.updateRoomPublicMessages();
    this.initSockets();
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
        const dialogRes = await this.utilsService.showConfirm({message: this.translationService.translations.room.openSessionConfirm});
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
        this.openToast('RoomStatus JANUS ERROR --- retrying...', 'warn');
        await this.updateRoomPublishers();
      }
      await this.updatePublishers(result.data.publishers);
      this.setUpdateRoomPublishersTimer();
    } catch (error) {
      console.error(error);
      this.setUpdateRoomPublishersTimer();
    }
  }

  private async updateRoomUsers() {
    try {
      const data = await this.getRoomActiveUsers().toPromise();
      this.roomUsers = data?.data?.items || [];
      const {added, deleted} = this.getRoomUsersDifference(data?.data?.items, this.roomUsers);
      if (added.length !== 0 || deleted.length !== 0) {
        this.roomUsers.push(...added);
        deleted?.forEach(d => {
          const index = this.roomUsers.findIndex(p => p.id === d.id);
          this.roomUsers.splice(index, 1);
        });
      }
      if (this.roomUsers.findIndex(u => u.id == this.currentUser.id) < 0) {
        this.roomUsers.unshift(this.currentUser);
      }
      this.updateViewService.setViewEvent({event: 'roomUsers', data: this.getSortedUsers()});
      this.raisedHands = this.roomUsers.filter(u => u.raise_hand);
      this.updateViewService.setViewEvent({event: 'raisedHandsChange', data: this.raisedHands});
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
    const myStream = this.myWebcam?.stream;
    if (myStream?.getAudioTracks()?.length) {
      this.toggleStreamAudio(myStream, activate);
      if (!myStream.getTracks()?.find(t => t.enabled)) {
        await this.toggleShareMedia(false, 'audio');
      }
      return;
    }
    await this.toggleShareMedia(activate, 'audio');
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
      throw Error(error);
    }
  }

  async toggleShareMedia(activate: boolean, mediaType: 'audio' | 'video'): Promise<void> {
    if (!activate) {
      await this.closeMyConnection('Webcam');
      return;
    }
    const stream = await this.getUserMedia({audio: true, video: true});
    const display = this.imStudent || this.isMainThumbPositionBusy() ? 'studentWebcam' : 'teacherWebcam';
    const options: PeerConnectionOptions = {
      display,
      position: this.getPosition(display),
      userId: this.currentUser.id,
      publishType: 'Webcam',
      stream
    };
    if (this.myWebcam) {
      this.myWebcam.close();
    }
    try {
      this.checkIsTalking(stream, async (value) => {
        if (!stream.getAudioTracks()[0].enabled) {
          return;
        }
        if (this.talkingTimer != null) {
          return;
        }
        if (Math.round(value) > 20) {
          await this.isTalking(true).toPromise();
        } else {
          await this.isTalking(false).toPromise();
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

  private async createSubscribeConnection(options: PeerConnectionOptions): Promise<PeerConnection> {
    return new Promise<PeerConnection>((resolve, reject) => {
      const pc = new PeerConnection({
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
        onDisconnect: () => {
          this.closeSubscribeConnection(options.userId, options.publishType);
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
          resolve(pc);
        },
        onError: (error: string) => {
          if (error == 'JANUS_ERROR') {
            this.openToast(`Subscribe JANUS ERROR -- retrying...`, 'warn');
            this.closeSubscribeConnection(options.userId, options.publishType);
            this.createSubscribeConnection(options);
          }
          if (error == 'SessionNotExist') {
            this.peerConnections.forEach(c => {
              this.closeSubscribeConnection(c.userId, c.publishType);
            });
            this.updateRoomPublishers();
          }
          this.updateViewService.setViewEvent({
            event: 'onError',
            data: {
              userId: options.userId,
              display: options.display,
              position: options.position,
              publishType: options.publishType,
            }
          });
        }
      });
      pc.createSubscribeConnection();
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
              userId: options.userId,
              display: options.display,
              position: options.position,
              stream: options.stream,
              publishType: options.publishType,
            }
          });
          resolve(pc);
        },
        onDisconnect: () => {
          this.updateViewService.setViewEvent({event: `activate${options.publishType}Button`, data: {value: false}});
          if (this.mainPositionUser?.id == options.userId) {
            this.removeMainPositionUser();
          }
          this.closeMyConnection(options.publishType, true);
        },
        onError: (error: string) => {
          if (error == 'JANUS_ERROR') {
            this.closeMyConnection(options.publishType, true);
            this.createPublishConnection(options, mediaType);
          }
          if (error == 'SessionNotExist') {
            this.peerConnections.forEach(c => {
              this.closeSubscribeConnection(c.userId, c.publishType);
            });
            this.updateRoomPublishers();
          }
          this.updateViewService.setViewEvent({
            event: 'onError',
            data: {
              userId: options.userId,
              display: options.display,
              position: options.position,
              publishType: options.publishType,
            }
          });
          reject(error);
        },
      });
      pc.createPublishConnection(mediaType);
    });
  }

  private async updatePublishers(publishers: Publisher[]) {
    const {added, deleted} = this.getPublishersDifference(publishers, this.peerConnections);
    if (added.length !== 0 || deleted.length !== 0) {

      deleted?.forEach(d => {
        this.closeSubscribeConnection(d.userId, d.publishType);
      });

      for (const publisher of added) {
        const display: DisplayName = publisher.display;
        const position: TrackPosition = this.getPosition(publisher.display);
        const publishId: any = publisher.id;
        const publishType: any = publisher.publish_type;
        const userId: any = publisher.user_id;
        const newPC = await this.createSubscribeConnection({publishId, userId, display, position, publishType});
        this.peerConnections.push(newPC);
      }
      this.updateViewService.setViewEvent({event: 'roomUsers', data: this.getSortedUsers()});
    }
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

  private setUpdateRoomPublishersTimer() {
    if (this.updateRoomPublishersTimer) {
      clearTimeout(this.updateRoomPublishersTimer);
    }
    this.updateRoomPublishersTimer = setTimeout(() => {
      this.updateRoomPublishers();
    }, GlobalConfig.updateRoomPublishersDelay);
  }

  private setUpdateRoomUsersTimer() {
    if (this.updateRoomUsersTimer) {
      clearTimeout(this.updateRoomUsersTimer);
    }
    this.updateRoomUsersTimer = setTimeout(() => {
      this.updateRoomUsers();
    }, GlobalConfig.updateRoomUsersDelay);
  }

  private removeMainPositionUser() {
    if (this.mainPositionUser) {
      this.mainPositionUser = null;
      this.updateViewService.setViewEvent({event: 'roomUsers', data: this.getSortedUsers()});
    }
  }

  private setMainPositionUser(userId: any) {
    this.mainPositionUser = this.getRoomUserById(userId);
    this.updateViewService.setViewEvent({event: 'roomUsers', data: this.getSortedUsers()});
  }

  private getSortedUsers() {
    this.updateViewService.setViewEvent({event: 'roomParticipants', data: this.roomUsers});
    let sortedUsers = [...this.roomUsers];
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

  initSockets() {
    this.socketService.start(this.currentRoom.id);
    this.socketSubscription = this.socketService.listen().subscribe(res => {
      console.log(`${res.event} => `, res);
      let user: RoomUser;
      switch (res.event) {
        case 'newUser':
          user = res.user;
          if (res.target != this.currentUser.id && this.roomUsers.findIndex(u => u.id == user.id) < 0) {
            this.roomUsers.push(user);
            this.updateViewService.setViewEvent({event: 'roomUsers', data: this.getSortedUsers()});
          }
          if (user.raise_hand == true && this.raisedHands.findIndex(u => u.id == user.id) < 0) {
            this.raisedHands.push(user);
            this.updateViewService.setViewEvent({event: 'raisedHandsChange', data: this.raisedHands});
          }
          break;

        case 'newPublisher':
          setTimeout(() => {
            this.updateRoomPublishers();
          }, 5000);
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
          const handRaiseIndex = this.raisedHands.findIndex(p => p.id == res.target);
          const userIndex = this.roomUsers.findIndex(u => u.id == res.target);
          if (handRaiseIndex > -1) {
            this.raisedHands.splice(handRaiseIndex, 1);
          }
          if (userIndex > -1) {
            this.roomUsers.splice(userIndex, 1);
          }
          if (res.target == this.currentUser.id) {
            this.getMeOut();
          }
          this.updateViewService.setViewEvent({event: 'raisedHandsChange', data: this.raisedHands});
          break;

        case 'userDisconnected':
        case 'leaveRoom':
          user = this.getRoomUserById(res.target);
          if (res.target != this.currentUser.id) {
            const connection = this.getPeerConnectionById(res.target);
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
            this.updateViewService.setViewEvent({event: 'roomUsers', data: this.getSortedUsers()});
            const handRaiseIndex = this.raisedHands.findIndex(p => p.id == res.target);
            if (handRaiseIndex > -1) {
              this.raisedHands.splice(handRaiseIndex, 1);
            }
            this.updateViewService.setViewEvent({event: 'raisedHandsChange', data: this.raisedHands});
          }
          if (res.event == 'leaveRoom') {
            if (res.target == this.currentUser.id) {
              this.getMeOut();
            } else if (res.target != this.currentUser.id && this.currentUser.role == 'Admin') {
              this.openToast('room.userLeftTheRoom', 'warn', user.last_name);
            }
          }
          break;

        case 'raiseHand':
          user = this.getRoomUserById(res.target);
          if (res.by == res.target) {
            const handRaiseIndex = this.raisedHands.findIndex(u => u.id == res.target);
            // hand raise occur by student
            if (res.value && handRaiseIndex < 0) {
              this.raisedHands.push(user);
              if (this.imTeacher) {
                this.openToast('room.userRaisedHand', 'warn', user.last_name);
              }
            } else {
              this.raisedHands.splice(handRaiseIndex, 1);
            }
            this.updateViewService.setViewEvent({event: 'studentRaisedHand', data: res});
          } else {
            // hand raise occur by teacher
            if (!res.value) {
              // the teacher reject student raise hand
              this.raisedHands.splice(this.raisedHands.findIndex(u => u.id == user.id), 1);
            }
            this.updateViewService.setViewEvent({event: 'teacherConfirmRaisedHand', data: res});
          }
          this.updateViewService.setViewEvent({event: 'raisedHandsChange', data: this.raisedHands});
          break;

        case 'mutePerson':
          user = this.getRoomUserById(res.target);
          user.muted = res.value;
          if (this.currentUser.id == res.target) {
            this.openToast(res.value ? 'room.yourVoiceAccessIsClosed' : 'room.yourVoiceAccessIsOpened', 'warn');
            if (res.value == true) {
              this.toggleMyAudio(false);
            }
            this.updateViewService.setViewEvent({event: 'mutePerson', data: res});

          }
          break;

        case 'muteVideo':
          user = this.getRoomUserById(res.target);
          user.muted_video = res.value;
          if (this.currentUser.id == res.target) {
            this.openToast(res.value ? 'room.yourVideoAccessIsClosed' : 'room.yourVideoAccessIsOpened', 'warn');
            if (res.value == true) {
              this.toggleMyVideo(false);
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
            this.openToast(res.value ? 'room.yourVoiceAccessIsClosed' : 'room.yourVoiceAccessIsOpened', 'warn');
            this.updateViewService.setViewEvent({event: 'muteAll', data: res});
            if (res.value == true) {
              this.toggleMyAudio(false);
            }
          }
          break;

        case 'muteVideoAll':
          this.roomUsers.forEach(p => {
            if (p.role != 'Admin') {
              p.muted_video = res.value;
            }
          });
          if (this.imStudent) {
            this.openToast(res.value ? 'room.yourVideoAccessIsClosed' : 'room.yourVideoAccessIsOpened', 'warn');
            this.updateViewService.setViewEvent({event: 'muteVideoAll', data: res});
            if (res.value == true) {
              this.toggleMyVideo(false);
            }
          }
          break;

        case 'assignAdmin':
          if (this.currentUser.id == res.target) {
            this.utilsService.showConfirm({message: this.translationService.translations.room.myRoleChangedConfirm}).then(dialogRes => {
              if (dialogRes) {
                document.location.reload();
              }
            });
          }
          break;

        case 'isTalking':
          this.updateViewService.setViewEvent({event: 'isTalking', data: res});
          break;

        case 'publicChatState':
          this.updateViewService.setViewEvent({event: 'publicChatState', data: res});
          break;

        case 'newMessage':
          this.updateViewService.setViewEvent({event: 'newPublicMessage', data: res});
          break;

        case 'deletedMessage':
          this.updateViewService.setViewEvent({event: 'deletedMessage', data: res});
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
      this.updateViewService.setViewEvent({event: 'publicMessages', data: result.data.items.reverse()});
    }
  }

  ///////////////////////////////////////////////////////////////////////////////
  //                                  GENERAL                                  //
  ///////////////////////////////////////////////////////////////////////////////
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

  private getPosition(display: DisplayName): TrackPosition {
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

  ///////////////////////////////////////////////////////////////////////////////
  //                                   UTILS                                   //
  ///////////////////////////////////////////////////////////////////////////////

  checkIsTalking(stream: MediaStream, callback: (v: number) => any) {
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
      callback(average);
    };
  }

  async getMeOut(message?: any) {
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
    this.socketService.tryConnection = false;
    this.socketService.clearPingTimer();
    this.socketService.close();
    this.socketSubscription.unsubscribe();
    if (message) {
      await this.utilsService.showDialog({message});
    }
    document.location.reload();
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

  private async checkConnectedDevices() {
    const webcamConnected = await this.webcamConnected();
    const micConnected = await this.micConnected();
    this.updateViewService.setViewEvent({event: 'webcamCheck', data: {value: webcamConnected}});
    this.updateViewService.setViewEvent({event: 'micCheck', data: {value: micConnected}});
  }

  async webcamConnected() {
    const webcamDevices = await this.getConnectedDevices('videoinput');
    return webcamDevices != [];
  }

  async micConnected() {
    const micDevices = await this.getConnectedDevices('audioinput');
    return micDevices != [];
  }

  openToast(translateKey: string, severity: NgMessageSeverities = 'error', translateValue: any = null) {
    this.utilsService.showToast({
      detail: this.translationService.instant(translateKey, {value: translateValue}) as string || translateKey,
      severity
    });
  }

  hasVideo(stream: MediaStream) {
    if (!stream) {
      return false;
    }
    return stream.getVideoTracks().findIndex(t => t.enabled) >= 0;
  }

  hasAudio(stream: MediaStream) {
    if (!stream) {
      return false;
    }
    return stream.getAudioTracks().findIndex(t => t.enabled) >= 0;
  }

  private async getConnectedDevices(type: DeviceType): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === type);
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
    return navigator.mediaDevices.getUserMedia(options);
  }

  private getUserScreen(): Promise<MediaStream> {
    return (navigator.mediaDevices as any).getDisplayMedia({audio: false});
  }

  private getRoomUsersDifference(base: RoomUser[], secondary: RoomUser[]) {
    if (!base || !secondary) {
      return;
    }
    const added = base.filter(b => secondary.findIndex(s => s.id === b.id) < 0);
    const deleted = secondary.filter(s => base.findIndex(b => b.id === s.id) < 0);
    return {added, deleted};
  }

  private getPublishersDifference(base: Publisher[], secondary: PeerConnection[]) {
    if (!base || !secondary) {
      return;
    }
    const added = base.filter(b => secondary.findIndex(s => s.publishId === b.id) < 0);
    const deleted = secondary.filter(s => base.findIndex(b => b.id === s.publishId) < 0);
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

  private getPublicMessages(data: SearchParam | {} = {}) {
    return this._post<any>('', {
      method: 'getPublicMessages',
      data: {room_id: this.currentRoom.id, ...data},
    });
  }

  deletePublicMessage(message_id: number) {
    return this._post<any>('', {
      method: 'deletePublicMessage',
      data: {message_id},
    });
  }

  isTalking(talking: boolean) {
    return this._post<any>('', {
      method: 'isTalking',
      data: {room_id: this.currentRoom.id, talking},
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
}
