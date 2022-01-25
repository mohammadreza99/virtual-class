import {Component, ElementRef, HostListener, OnInit, ViewChild} from '@angular/core';
import {RoomService, SessionService} from '@core/http';
import {ActivatedRoute, Router} from '@angular/router';
import {Room} from '@core/models';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';

@Component({
  selector: 'ng-room-info',
  templateUrl: './room-info.page.html',
  styleUrls: ['./room-info.page.scss']
})
export class RoomInfoPage extends LanguageChecker implements OnInit {
  constructor(private roomService: RoomService, private sessionService: SessionService, private route: ActivatedRoute, private router: Router) {
    super();
  }

  @ViewChild('videoPreview', {static: true}) videoElem: ElementRef<HTMLMediaElement>;


  room: Room;
  roomUsers: number;
  stream: MediaStream;
  webcamTestActive: boolean = false;
  message: string = this.translations.pleaseTestWebcam;

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
      }
      const result = await this.roomService.getRoomById(roomId).toPromise();
      if (result.status == 'OK') {
        this.room = result.data;
      }
      const webcamConnected = await this.sessionService.webcamConnected();
      if (!webcamConnected) {
        this.message = this.translations.webcamNotFound;
      }
    } catch (error) {
      console.error(error);
    }
  }

  async toggleWebcam() {
    this.webcamTestActive = !this.webcamTestActive;
    if (this.webcamTestActive) {
      try {
        this.stream = await this.sessionService.getUserMedia();
      } catch (error) {
        if (error.name == 'NotAllowedError') {
          this.message = this.translations.pleaseAllowWebcam;
        } else {
          this.message = this.translations.webcamNotFound;
        }
        this.resetTest();
        return;
      }
      if (!this.stream) {
        this.message = this.translations.webcamNotFound;
        this.resetTest();
        return;
      }
      this.videoElem.nativeElement.srcObject = this.stream;
      await this.videoElem.nativeElement.play();
      this.message = null;
    } else {
      this.stopVideo();
      this.webcamTestActive = false;
      this.message = this.translations.pleaseTestWebcam;
    }
  }

  resetTest() {
    this.webcamTestActive = false;
    setTimeout(() => {
      this.message = this.translations.pleaseTestWebcam;
    }, 3000);
  }

  stopVideo() {
    this.videoElem.nativeElement.pause();
    this.videoElem.nativeElement.srcObject = null;
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
      });
    }
  }

  enterRoom() {
    this.stopVideo();
    const roomId = +this.route.snapshot.paramMap.get('roomId');
    localStorage.setItem('roomEnterTime', Date.now().toString());
    if (this.room) {
      this.router.navigate(['/vc', roomId]);
    }
  }
}
