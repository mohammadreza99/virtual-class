import {Component, ElementRef, Input, OnDestroy, OnInit, Renderer2, ViewChild} from '@angular/core';
import {SessionService} from '@core/http';
import {RoomUser, TrackPosition} from '@core/models';
import {UpdateViewService} from '@core/utils';
import {GlobalConfig} from '@core/global.config';
import {takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';

@Component({
  selector: 'ng-screen',
  templateUrl: './screen.component.html',
  styleUrls: ['./screen.component.scss']
})
export class ScreenComponent implements OnInit, OnDestroy {

  @Input() user: RoomUser;
  @Input() position: TrackPosition;
  @ViewChild('videoElem', {static: true}) videoElem: ElementRef<HTMLMediaElement>;

  destroy$: Subject<boolean> = new Subject<boolean>();
  streamActivated: boolean = false;
  isTalking: boolean = false;
  stream: MediaStream;
  isTalkingUpdateTimer: any;
  activateRaiseHand: boolean = false;

  constructor(
    private sessionService: SessionService,
    private updateViewService: UpdateViewService,
    private elementRef: ElementRef,
    private renderer: Renderer2,
  ) {
  }

  ngOnInit(): void {
    this.updateViewService.getViewEvent().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      if (['onTrack', 'onDisconnect'].findIndex(e => e == res.event) > -1) {
        if (this.position !== res.data.position) {
          return;
        }
        if (!this.isInMainPosition() && (this.user && this.user.id !== res.data.userId)) {
          return;
        }
        if (res.data.userId == this.sessionService.currentUser.id) {
          this.videoElem.nativeElement.muted = true;
        }
        switch (res.event) {
          case 'onTrack':
            this.handleTrackClassNames(res.data);
            this.setStream(res.data.stream);
            break;

          case 'onDisconnect':
            this.handleDisconnectClassNames(res.data);
            this.streamActivated = false;
            this.stream = null;
            this.videoElem.nativeElement.srcObject = null;
            break;
        }
      }
      if (!this.user) {
        return;
      }
      switch (res.event) {
        case 'studentRaisedHand':
          if (res.data.target == this.user.id) {
            this.user.raise_hand = res.data.value;
            if (!res.data.value) {
              this.activateRaiseHand = false;
            }
          }
          break;

        case 'teacherConfirmRaisedHand':
          if (res.data.target == this.user.id) {
            this.user.raise_hand = res.data.value;
            this.activateRaiseHand = res.data.value;
          }
          break;

        case 'isTalking':
          if (res.data.target != this.user.id) {
            return;
          }
          if (res.data.value) {
            this.isTalking = true;
            if (this.isTalkingUpdateTimer) {
              clearTimeout(this.isTalkingUpdateTimer);
            }
            this.isTalkingUpdateTimer = setTimeout(() => {
              this.isTalking = false;
            }, GlobalConfig.isTalkingDisplayTime);
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
  }

  onClick() {
    this.sessionService.setUserDisplayToMain(this.user.id);
  }


  hasVideo() {
    return this.sessionService.hasVideo(this.stream);
  }

  private handleTrackClassNames(res: any) {
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

  private handleDisconnectClassNames(res: any) {
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

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  toggleFullScreen() {
    const video = this.videoElem.nativeElement as any;
    if (video.requestFullscreen) {
      video.requestFullscreen();
    } else if (video.webkitRequestFullscreen) {
      video.webkitRequestFullscreen();
    } else if (video.msRequestFullscreen) {
      video.msRequestFullscreen();
    }
  }
}
