import {Component, ElementRef, HostListener, OnInit, ViewChild} from '@angular/core';
import {RoomService, SessionService} from '@core/http';
import {ActivatedRoute, Router} from '@angular/router';
import {Room} from '@core/models';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {NgMessage} from '@ng/models/overlay';
import {UtilsService} from '@ng/services';

@Component({
  selector: 'ng-room-info',
  templateUrl: './room-info.page.html',
  styleUrls: ['./room-info.page.scss']
})
export class RoomInfoPage extends LanguageChecker implements OnInit {
  constructor(private roomService: RoomService,
              private sessionService: SessionService,
              private utilsService: UtilsService,
              private route: ActivatedRoute,
              private router: Router) {
    super();
  }

  @ViewChild('videoPreview', {static: true}) videoElem: ElementRef<HTMLMediaElement>;
  @ViewChild('audioPreview', {static: true}) audioElem: ElementRef<HTMLMediaElement>;

  room: Room;
  roomUsers: number;
  videoStream: MediaStream;
  audioStream: MediaStream;
  webcamTestActive: boolean = false;
  micTestActive: boolean = false;
  roomStatusMessage: NgMessage[];
  limitMode: boolean = false;

  ngOnInit(): void {
    this.loadData();
    this.videoElem.nativeElement.muted = true;
  }

  async loadData() {
    try {
      const roomId = +this.route.snapshot.paramMap.get('roomId');
      const token = this.route.snapshot.queryParamMap.get('t');
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('limitMode', 'true');
        this.limitMode = true;
      }
      const result = await this.roomService.getRoomById(roomId).toPromise();
      if (result.status == 'OK') {
        this.room = result.data;
      }
      await this.checkEnterRoomStatus();
      const webcamConnected = await this.sessionService.webcamConnected();
      if (!webcamConnected) {
        this.openToast('webcamNotFound');
      }
    } catch (error) {
      console.error(error);
    }
  }

  async toggleWebcam(event: any) {
    this.webcamTestActive = event.checked;
    if (this.webcamTestActive) {
      try {
        this.videoStream = await this.sessionService.getUserMedia({video: true});
      } catch (error) {
        if (error.name == 'NotAllowedError') {
          this.openToast('pleaseAllowWebcam');
        } else {
          this.openToast('webcamNotFound');
        }
        this.resetTest();
        return;
      }
      if (!this.videoStream) {
        this.openToast('webcamNotFound');
        this.resetTest();
        return;
      }
      this.videoElem.nativeElement.srcObject = this.videoStream;
      await this.videoElem.nativeElement.play();
    } else {
      this.stopVideo();
      this.webcamTestActive = false;
    }
  }

  async toggleMic(event: any) {
    this.micTestActive = event.checked;
    if (this.micTestActive) {
      try {
        this.audioStream = await this.sessionService.getUserMedia({audio: true});
      } catch (error) {
        if (error.name == 'NotAllowedError') {
          this.openToast('pleaseAllowMic');
        } else {
          this.openToast('micNotFound');
        }
        this.resetTest();
        return;
      }
      if (!this.audioStream) {
        this.openToast('micNotFound');
        this.resetTest();
        return;
      }
      this.audioElem.nativeElement.srcObject = this.audioStream;
      await this.audioElem.nativeElement.play();
    } else {
      this.stopVideo();
      this.micTestActive = false;
    }
  }

  resetTest() {
    this.webcamTestActive = false;
    this.micTestActive = false;
  }

  stopVideo() {
    this.videoElem.nativeElement.pause();
    this.videoElem.nativeElement.srcObject = null;
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => {
        track.stop();
      });
    }
  }

  stopAudio() {
    this.audioElem.nativeElement.pause();
    this.audioElem.nativeElement.srcObject = null;
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => {
        track.stop();
      });
    }
  }

  async enterRoom() {
    const result = await this.checkEnterRoomStatus();
    if (result) {
      this.stopVideo();
      const roomId = +this.route.snapshot.paramMap.get('roomId');
      localStorage.setItem('roomEnterTime', Date.now().toString());
      this.router.navigate(['/vc', roomId]);
    }
  }

  async checkEnterRoomStatus() {
    if (!this.room) {
      return;
    }
    const result = await this.sessionService.userEnterStatus(this.room.id).toPromise();
    if (result.status != 'OK') {
      return;
    }
    switch (result.data.enter_status) {
      case'Enter':
        this.roomStatusMessage = [{severity: 'warn', detail: this.translations.teacherIsInRoom}];
        return true;
      case'RoomNotStarted':
        this.roomStatusMessage = [{severity: 'warn', detail: this.translations.teacherIsNotInRoom}];
        return false;
      case'Kicked':
        this.roomStatusMessage = [{severity: 'warn', detail: this.translations.yourKicked}];
        return false;
      case'TemporaryKicked':
        const message = this.translationService.instant('yourTemporaryKicked', {value: result.data.kick_time}) as string;
        this.roomStatusMessage = [{severity: 'warn', detail: message}];
        return false;
      default:
        return false;
    }
  }

  openToast(message: string) {
    this.utilsService.showToast({
      severity: 'warn',
      detail: this.translations[message]
    });
  }
}
