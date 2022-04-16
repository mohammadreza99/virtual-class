import {PeerConnectionOptions, TrackPosition} from '../models/webrtc.model';
import {Global} from '@ng/global';
import {UpdateViewService} from '@core/http/update-view.service';
import {Subscription} from 'rxjs';
import {SessionService} from '@core/http';

export class PeerConnection {

  private pc: RTCPeerConnection;
  private subscription: Subscription;
  private sessionService: SessionService;

  constructor(private options: PeerConnectionOptions) {
    const updateViewService = Global.Injector.get(UpdateViewService);
    this.sessionService = Global.Injector.get(SessionService);
    if (!this.options) {
      throw Error('Invalid Options');
    }
    this.pc = new RTCPeerConnection();
    this.pc.onconnectionstatechange = (e: Event) => {
      this.handleConnectionStateChange(e);
    };
    this.pc.ontrack = (e: RTCTrackEvent) => {
      if (this.options.onTrack) {
        this.options.stream = e.streams[0];
        this.options.onTrack(e);
      }
    };
    this.subscription = updateViewService.getViewEvent().subscribe(async res => {
      switch (res.event) {
        case 'newMedia':
          // subscribe
          if (res.data.p_type == 'offer') {
            if (this.sessionService.currentUser.id != res.data.target) {
              return;
            }
            if (res.data.target == this.options.userId) {
              return;
            }
            await this.pc.setRemoteDescription({type: 'offer', sdp: res.data.sdp});
            const answer = await this.pc.createAnswer();
            await this.pc.setLocalDescription(answer);
            const result = await this.options.startSubscription(answer.sdp);
            if (result.status_det == 'JANUS_ERROR') {
              this.options.onError('JANUS_ERROR');
              return;
            }
            if (result.status_det == 'SessionNotExist') {
              this.options.onError('SessionNotExist');
              return;
            }
          }

          // publish
          if (res.data.p_type == 'answer') {
            if (res.data.target != this.options.userId) {
              return;
            }
            await this.pc.setRemoteDescription({type: 'answer', sdp: res.data.sdp});
            await this.options.publishConfirm();
            if (this.options.onTrack) {
              this.options.onTrack();
            }
          }

          break;
      }
    });

  }

  async createSubscribeConnection() {
    try {
      const remoteOffer = await this.options.getRemoteOfferSdp();
      if (remoteOffer.status_det == 'JANUS_ERROR') {
        this.options.onError('JANUS_ERROR');
        return;
      }
      if (remoteOffer.status_det == 'SessionNotExist') {
        this.options.onError('SessionNotExist');
        return;
      }
      // await this.pc.setRemoteDescription({type: 'offer', sdp: remoteOffer.data.sdp_offer_data});
      // const answer = await this.pc.createAnswer();
      // await this.pc.setLocalDescription(answer);
      // const result = await this.options.startSubscription(answer.sdp);
      // if (result.status_det == 'JANUS_ERROR') {
      //   this.options.onError('JANUS_ERROR');
      //   return;
      // }
      // if (result.status_det == 'SessionNotExist') {
      //   this.options.onError('SessionNotExist');
      //   return;
      // }
    } catch (error) {
      console.error(error);
      if (this.options.onError) {
        this.options.onError(error);
      }
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
        this.options.onError('JANUS_ERROR');
        return;
      }
      // await this.pc.setRemoteDescription({type: 'answer', sdp: result.data.sdp_answer_data});
      // await this.options.publishConfirm();
      // if (this.options.onTrack) {
      //   this.options.onTrack();
      // }
    } catch (error) {
      console.error(error);
      if (this.options.onError) {
        this.options.onError(error);
      }
    }
  }

  close() {
    this.pc.close();
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
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
      console.error(`webrtc connection ${this.pc.connectionState}. ID =>`, this.userId);
      if (this.options.onError) {
        this.options.onError(`connection failed => ID:${this.userId}`);
      }
    }
    if (this.pc.connectionState === 'connected') {
      if (this.options.onConnect) {
        this.options.onConnect();
      }
    }
    if (this.pc.connectionState === 'disconnected' || this.pc.connectionState === 'closed') {
      console.error(`webrtc connection ${this.pc.connectionState}. ID =>`, this.userId);
      if (this.options.onDisconnect) {
        this.options.onDisconnect();
      }
    }
  }
}
