import {Injectable} from '@angular/core';
import {webSocket, WebSocketSubject} from 'rxjs/webSocket';
import {ApiService} from '@core/http/api.service';
import {Subject, Subscription} from 'rxjs';
import {DeviceType, RoomEventType} from '@core/models';
import {GlobalConfig} from '@core/global.config';

@Injectable({providedIn: 'root'})
export class SocketService extends ApiService {
  private webSocket: WebSocketSubject<any>;
  private socketChannel = new Subject<{ event: RoomEventType, [key: string]: any }>();
  private subscription: Subscription;
  private roomId: number;
  private reconnectTimer: any;
  private pingTimer: any;
  private connected = false;

  constructor() {
    super();
  }

  start(roomId: number) {
    this.close();
    if (this.connected) {
      return;
    }
    this.roomId = roomId;
    this.createSocketConnection();
  }

  close() {
    if (!this.connected) {
      return;
    }
    this.webSocket?.complete();
    this.clearPingTimer();
    this.clearReconnectTimer();
    this.webSocket = null;
    this.subscription?.unsubscribe();
    this.connected = false;
  }

  listen() {
    return this.socketChannel.asObservable();
  }

  private async getSocketInstance() {
    const has_cam = await this.webcamConnected();
    const has_mic = await this.micConnected();
    const device = this.getDeviceType();
    const socketUrl = `${this.socketBaseUrl}/?token=${localStorage.getItem('token')}&room_id=${this.roomId}&has_cam=${has_cam}&has_mic=${has_mic}&device=${device}`;
    return webSocket(socketUrl);
  }

  private async createSocketConnection() {
    this.webSocket = await this.getSocketInstance();
    this.subscription = this.webSocket.subscribe(
      async (res) => {
        this.socketChannel.next({event: res.method || res, ...res.data});
        if (res == 'reconnect') {
          this.handleSocketFailure();
          return;
        }
        this.connected = true;
        this.clearReconnectTimer();
      },
      (err) => {
        if (this.webSocket) {
          this.handleSocketFailure();
        }
        console.error(err);
      },
      () => {
        this.socketChannel.next({event: 'sessionExist', data: true});
      });
    this.sendPing();
  }

  private handleSocketFailure() {
    this.close();
    this.retryConnection();
  }

  private retryConnection() {
    this.clearReconnectTimer();
    this.reconnectTimer = setTimeout(() => {
      this.createSocketConnection();
    }, GlobalConfig.socketConnectOnErrorRetryDelay); // 5000
  }

  private sendPing() {
    this.clearPingTimer();
    this.pingTimer = setTimeout(() => {
      this.webSocket.next('ping');
      this.sendPing();
    }, GlobalConfig.socketPingRetryDelay); // 30000
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
