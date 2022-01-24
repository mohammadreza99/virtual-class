import {Injectable} from '@angular/core';
import {webSocket, WebSocketSubject} from 'rxjs/webSocket';
import {ApiService} from '@core/http/api.service';
import {Subject, Subscription} from 'rxjs';

@Injectable({providedIn: 'root'})
export class SocketService extends ApiService {
  private webSocket: WebSocketSubject<any>;
  private socketChannel = new Subject<any>();
  private subscription: Subscription;
  private roomId: number;
  private token: string;
  private reconnectTimer: any;
  private pingTimer: any;
  private started = false;
  private connected = false;
  tryConnection = true;

  constructor() {
    super();
    this.token = localStorage.getItem('token');
  }

  start(roomId: number) {
    if (this.started) {
      return;
    }
    this.roomId = roomId;
    this.started = true;
    this.close();
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.createSocketConnection();
  }

  stop() {
    this.started = false;
    this.close();
  }

  close() {
    if (this.connected) {
      this.webSocket.complete();
      this.subscription.unsubscribe();
    }
  }

  listen() {
    return this.socketChannel.asObservable();
  }

  private createSocketConnection() {
    this.webSocket = webSocket(this.socketBaseUrl);
    this.sendConnect();
    console.log('connect sent');
    this.subscription = this.webSocket.subscribe((res) => {
      this.connected = true;
      this.socketChannel.next({event: res.method, ...res.data});
      this.retryConnection(true);
      this.pingWithDelay();
    }, (err) => {
      this.connected = false;
      this.close();
      this.webSocket = null;
      this.retryConnection();
    }, () => {
      this.retryConnection();
    });
  }

  private retryConnection(clear?: boolean, delay?: number) {
    this.clearReconnectTimer();
    if (!this.tryConnection) {
      return;
    }
    if (clear) {
      return;
    }
    this.reconnectTimer = setTimeout(() => {
      this.createSocketConnection();
    }, (delay || 5) * 1000);
  }

  private pingWithDelay() {
    this.clearPingTimer();
    this.pingTimer = setTimeout(() => {
      this.sendPing();
      this.retryConnection(false, 20);
    }, 30000);
  }

  private sendPing() {
    this.webSocket.next({
      auth: this.token,
      method: 'ping'
    });
  }

  private sendConnect() {
    this.webSocket.next({
      auth: this.token,
      method: 'connect',
      data: {room_id: this.roomId}
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
}
