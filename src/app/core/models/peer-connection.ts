import {PeerConnectionOptions, TrackPosition} from '../models/webrtc.model';
import {Global} from '@ng/global';
import {SessionService} from '@core/http';
import {UpdateViewService} from '@core/utils';
import {Subscription} from 'rxjs';

export class PeerConnection {

  private sessionService: SessionService;
  private updateViewService: UpdateViewService;
  public pc: RTCPeerConnection;
  private subscription: Subscription;

  constructor(public options: PeerConnectionOptions) {
    this.sessionService = Global.Injector.get(SessionService);
    this.updateViewService = Global.Injector.get(UpdateViewService);
    this.pc = new RTCPeerConnection();

    this.subscription = this.updateViewService.getViewEvent().subscribe(res => {
      switch (res.event) {
        // we just use this subscription in publish mode because we dont want to set any retry and etc functions to that.
        // so control it in PeerConnection own class.
        case 'remoteAnswer':
          this.setRemoteAnswer(res.data.sdp);
          break;
      }
    });

    this.pc.onconnectionstatechange = (e: Event) => {
      this.handleConnectionStateChange(e);
    };

    // run in subscribe mode
    this.pc.ontrack = (e: RTCTrackEvent) => {
      if (this.options.onTrack) {
        this.options.stream = e.streams[0];
        this.options.onTrack(e);
      }
    };
  }

  // calls when socket recieved
  async setRemoteOffer(sdp) {
    await this.pc.setRemoteDescription({type: 'offer', sdp});
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    const result = await this.options.startSubscription(answer.sdp);
    if (result.status != 'OK') {
      this.options.onFailed('failed');
      return;
    }
  }

  // calls when socket recieved
  async setRemoteAnswer(sdp) {
    await this.pc.setRemoteDescription({type: 'answer', sdp});
    await this.options.publishConfirm();
    this.options.onTrack();
    // when the publish connection was successful (options.onTrack() was called), we no longer need to listen to remote answer.
    this.subscription?.unsubscribe();
  }

  async startSubscribeConnection() {
    try {
      const remoteOffer = await this.options.getRemoteOfferSdp();
      if (remoteOffer.status != 'OK') {
        this.options.onFailed('start subscribe failed');
        return;
      }
      setTimeout(() => {
        if (this.pc.connectionState == 'new') {
          this.options.onFailed('failed');
        }
      }, 10000);
      //
      // await this.pc.setRemoteDescription({type: 'offer', sdp: remoteOffer.data.sdp_offer_data});
      // const answer = await this.pc.createAnswer();
      // await this.pc.setLocalDescription(answer);
      // const result = await this.options.startSubscription(answer.sdp);
      // if (result.status_det == 'JANUS_ERROR') {
      //   this.options.onFailed('JANUS_ERROR');
      //   return;
      // }
      // if (result.status_det == 'SessionNotExist') {
      //   this.options.onFailed('SessionNotExist');
      //   return;
      // }
      //
    } catch (error) {
      console.error(error);
      this.options.onFailed(error);
    }
  }

  async createPublishConnection(mediaType: 'audio' | 'video'): Promise<void> {
    const offerOptions: RTCOfferOptions = {offerToReceiveAudio: true, offerToReceiveVideo: true};
    if (mediaType == 'audio') {
      this.options.stream.getVideoTracks().forEach(t => {
        t.enabled = false;
      });
    } else {
      this.options.stream.getAudioTracks().forEach(t => {
        t.enabled = false;
      });
    }
    this.options.stream.getTracks().forEach(track => {
      this.pc.addTrack(track);
    });
    try {
      const offer = await this.pc.createOffer(offerOptions);
      await this.pc.setLocalDescription(offer);
      const result = await this.options.getRemoteAnswerSdp(offer.sdp);
      if (result.status_det == 'JANUS_ERROR') {
        this.options.onFailed('JANUS_ERROR');
        return;
      }
      //
      // await this.pc.setRemoteDescription({type: 'answer', sdp: result.data.sdp_answer_data});
      // await this.options.publishConfirm();
      // if (this.options.onTrack) {
      //   this.options.onTrack();
      // }
      //
    } catch (error) {
      console.error(error);
      this.options.onFailed(error);
    }
  }

  close() {
    this.pc.close();
    this.subscription?.unsubscribe();
  }

  get position() {
    return this.options.position;
  }

  set position(p: TrackPosition) {
    this.options.position = p;
  }

  get userId() {
    return this.options.userId;
  }

  get stream() {
    return this.options.stream;
  }

  get display() {
    return this.options.display;
  }

  get publishType() {
    return this.options.publishType;
  }

  get publishId() {
    return this.options.publishId;
  }

  private handleConnectionStateChange(e: Event) {
    if (this.pc.connectionState === 'failed') {
      console.error(`-- WEB_RTC FOR USER ID ${this.userId} HAS ${this.pc.connectionState} - MY ID => ${this.sessionService.currentUser.id}`);
      this.options.onFailed();
    }
    if (this.pc.connectionState === 'connected') {
      this.options.onConnect();
    }
    if (this.pc.connectionState === 'disconnected') {
      console.error(`-- WEB_RTC FOR USER ID ${this.userId} HAS ${this.pc.connectionState} - MY ID => ${this.sessionService.currentUser.id}`);
      this.options.onDisconnect();
    }
    if (this.pc.connectionState === 'closed') {
      this.options.onClose();
    }
  }
}
