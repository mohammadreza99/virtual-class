import {Component, ElementRef, Input, OnInit, Renderer2, ViewChild} from '@angular/core';
import {SessionService, SocketService} from '@core/http';
import {RoomUser, StreamActionEvent, TrackPosition} from '@core/models';
import {UpdateViewService} from '@core/http/update-view.service';

@Component({
  selector: 'ng-screen',
  templateUrl: './screen.component.html',
  styleUrls: ['./screen.component.scss']
})
export class ScreenComponent implements OnInit {

  @Input() user: RoomUser;
  @Input() position: TrackPosition;
  @ViewChild('videoElem', {static: true}) videoElem: ElementRef<HTMLMediaElement>;

  streamActivated: boolean = false;
  stream: MediaStream;

  constructor(
    private sessionService: SessionService,
    private updateViewService: UpdateViewService,
    private socketService: SocketService,
    private elementRef: ElementRef,
    private renderer: Renderer2,
  ) {
  }

  ngOnInit(): void {
    this.sessionService.onStreamChange().subscribe((res: StreamActionEvent) => {
      if (this.position !== res.position) {
        return;
      }
      if (!this.isInMainPosition() && (this.user && this.user.id !== res.userId)) {
        return;
      }
      if (res.userId == this.sessionService.currentUser.id) {
        this.videoElem.nativeElement.muted = true;
      }
      switch (res.action) {
        case 'onTrack':
          this.handleTrackClassNames(res);
          this.setStream(res.stream);
          break;
        case 'onDisconnect':
          this.handleDisconnectClassNames(res);
          this.streamActivated = false;
          this.stream = null;
          this.videoElem.nativeElement.srcObject = null;
          break;
      }
    });

    this.updateViewService.getViewEvent().subscribe(res => {
      switch (res.event) {
        case 'raiseHand':
          if (this.user && res.data.target == this.user.id) {
            this.user.raise_hand = res.data.value;
          }
          break;
      }
    });
  }

  private setStream(stream: MediaStream) {
    const video = this.videoElem.nativeElement;
    if (!stream) {
      video.srcObject = null;
      return;
    }
    video.load();
    this.stream = stream;
    this.streamActivated = true;
    video.srcObject = stream;
    video.onloadedmetadata = (e) => {
      video.play();
    };
    // return video.play();
  }


  hasVideo() {
    return this.sessionService.hasVideo(this.stream);
  }

  private handleTrackClassNames(res: StreamActionEvent) {
    this.addClass(res.display);
    this.addClass(res.position);
    if (this.isInMainPosition()) {
      this.user = this.sessionService.getRoomUserById(res.userId);
      if (res.position === 'mainThumbPosition') {
        this.addClass('teacher-webcam-shared');
      }
      if (res.position === 'mainPosition') {
        this.addClass('teacher-screen-shared');
      }
    }
    if (res.userId === this.sessionService.currentUser.id) {
      this.addClass(`my-${res.publishType.toLowerCase()}-shared`);
    }
  }

  private handleDisconnectClassNames(res: StreamActionEvent) {
    this.addClass('disconnected');
    if (this.isInMainPosition()) {
      this.user = this.sessionService.getRoomUserById(res.userId);
      if (res.position === 'mainThumbPosition') {
        this.removeClass('teacher-webcam-shared');
      }
      if (res.position === 'mainPosition') {
        this.removeClass('teacher-screen-shared');
      }
    }
    if (res.userId === this.sessionService.currentUser.id) {
      this.removeClass(`my-${res.publishType.toLowerCase()}-shared`);
    }
  }


  private addClass(className: string) {
    this.renderer.addClass(this.elementRef.nativeElement, className);
  }

  private removeClass(className: string) {
    this.renderer.removeClass(this.elementRef.nativeElement, className);
  }

  private isInMainPosition() {
    return ['mainThumbPosition', 'mainPosition'].indexOf(this.position) >= 0;
  }


  getColor() {
    if (this.user) {
      return this.sessionService.getProfileColor(this.user.id);
    }
  }

}
