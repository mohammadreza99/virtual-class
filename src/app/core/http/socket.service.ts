import {Injectable} from '@angular/core';
import {webSocket, WebSocketSubject} from 'rxjs/webSocket';
import {ApiService} from '@core/http/api.service';
import {filter, map} from 'rxjs/operators';
import {SocketEventTypes} from '@core/models';
import {Subscription} from 'rxjs';
import {environment} from '../../../environments/environment';

@Injectable({providedIn: 'root'})
export class SocketService extends ApiService {
  private webSocket: WebSocketSubject<any>;
  private subscription: Subscription;
  private roomId: number;
  private token: string;
  private reconnectTimer: any;
  private pingTimer: any;
  private started = false;
  private connected = false;

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
    }
  }

  listen(eventName?: SocketEventTypes) {
    if (!eventName) {
      return this.webSocket.asObservable();
    }

    return this.webSocket.asObservable().pipe(
      map((item: any) => ({event: item.method, ...item.data})),
      filter((ws: any) => {
        return ws.event == eventName;
      })
    );
  }

  private createSocketConnection() {
    this.webSocket = webSocket(environment.socketUrl);
    this.sendConnect();
    console.log('connect sent');
    this.subscription = this.listen().subscribe(() => {
      this.connected = true;
      this.retryConnection(true);
      this.pingWithDelay();
    }, (err) => {
      this.connected = false;
      this.retryConnection();
    }, () => {
      this.retryConnection();
    });
  }

  private retryConnection(clear?: boolean, delay?: number) {
    this.clearReconnectTimer();
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
