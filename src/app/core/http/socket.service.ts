import {Injectable} from '@angular/core';
import {webSocket, WebSocketSubject} from 'rxjs/webSocket';
import {ApiService} from '@core/http/api.service';
import {Subject, Subscription} from 'rxjs';
import {DeviceType, SocketEventTypes} from '@core/models';
import {GlobalConfig} from '@core/global.config';
import {Router} from '@angular/router';

@Injectable({providedIn: 'root'})
export class SocketService extends ApiService {
  private webSocket: WebSocketSubject<any>;
  private socketChannel = new Subject<{ event: SocketEventTypes, [key: string]: any }>();
  private subscription: Subscription;
  private roomId: number;
  private reconnectTimer: any;
  private pingTimer: any;
  private started = false;
  private connected = false;
  private retryCount: number = GlobalConfig.socketConnectRetryCount;

  constructor(private router: Router) {
    super();
  }

  start(roomId: number) {
    if (this.started) {
      return;
    }

    this.roomId = roomId;
    this.started = true;
    this.close();
    this.createSocketConnection();
  }

  stop() {
    this.started = false;
    this.close();
  }

  close() {
    if (this.connected) {
      this.webSocket?.complete();
      this.webSocket = null;
      if (this.subscription) {
        this.subscription.unsubscribe();
      }
    }
  }

  listen() {
    return this.socketChannel.asObservable();
  }

  private async createSocketConnection() {
    this.webSocket = webSocket(this.socketBaseUrl);
    await this.sendConnect();
    console.log('connect sent');
    this.subscription = this.webSocket.subscribe(
      async (res) => {
        this.socketChannel.next({event: res.method, ...res.data});
        if (res.method == 'FAILURE') {
          this.connected = false;
          if (this.retryCount > 0) {
            await this.sendConnect();
            this.retryCount--;
            return;
          }

          if (this.retryCount == 0 && !this.connected) {
            this.router.navigate(['/no-internet'], {queryParams: {returnUrl: `/vc/room-info/${this.roomId}`}});
            return;
          }
        } else {
          this.connected = true;
          this.retryCount = GlobalConfig.socketConnectRetryCount;
        }
        this.clearReconnectTimer();
        this.pingWithDelay();
      },
      (err) => {
        if (this.webSocket) {
          this.handleSocketFailure();
        }
        console.error(err);
      },
      () => {
        if (this.webSocket) {
          this.retryConnection(GlobalConfig.socketConnectOnErrorRetryDelay);
        }
      });
  }

  private handleSocketFailure() {
    this.connected = false;
    this.close();
    this.retryConnection(GlobalConfig.socketConnectOnErrorRetryDelay);
  }

  private retryConnection(delay: number) {
    this.clearReconnectTimer();
    this.reconnectTimer = setTimeout(() => {
      this.createSocketConnection();
    }, delay);
  }

  private pingWithDelay() {
    this.clearPingTimer();
    this.pingTimer = setTimeout(() => {
      this.sendPing();
      this.retryConnection(GlobalConfig.socketConnectRetryDelay);
    }, GlobalConfig.socketPingRetryDelay);
  }

  private sendPing() {
    this.webSocket.next({
      auth: localStorage.getItem('token'),
      data: {
        room_id: this.roomId,
      },
      method: 'ping'
    });
  }

  private async sendConnect() {
    const has_cam = await this.webcamConnected();
    const has_mic = await this.micConnected();
    const device = this.getDeviceType();
    this.webSocket.next({
      auth: localStorage.getItem('token'),
      method: 'connect',
      data: {room_id: this.roomId, has_cam, has_mic, device}
    });
  }

  clearPingTimer() {
    if (this.pingTimer) {
      clearTimeout(this.pingTimer);
    }
  }

  clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
  }

  private async webcamConnected() {
    const webcamDevices = await this.getConnectedDevices('videoinput');
    return webcamDevices != [];
  }

  private async micConnected() {
    const micDevices = await this.getConnectedDevices('audioinput');
    return micDevices != [];
  }

  private async getConnectedDevices(type: DeviceType): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === type);
  }

  private getDeviceType() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'Mobile';
    }
    if (
      /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
        ua
      )
    ) {
      return 'Mobile';
    }
    return 'Desktop';
  }
}
