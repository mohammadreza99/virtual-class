import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
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
  message: string = 'جهت تست دوربین کلیک کنید';

  ngOnInit(): void {
    this.loadData();
    this.videoElem.nativeElement.muted = true;
  }

  async loadData() {
    try {
      const roomId = +this.route.snapshot.paramMap.get('roomId');
      const result = await this.roomService.getRoomById(roomId).toPromise();
      if (result.status == 'OK') {
        this.room = result.data;
      }
      const webcamConnected = await this.sessionService.webcamConnected();
      if (!webcamConnected) {
        this.message = 'وبکم یافت نشد';
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
          this.message = 'لطفا دسترسی دوربین را باز کنید';
        } else {
          this.message = 'وبکم یافت نشد';
        }
        this.resetTest();
        return;
      }
      if (!this.stream) {
        this.message = 'وبکم یافت نشد';
        this.resetTest();
        return;
      }
      this.videoElem.nativeElement.srcObject = this.stream;
      await this.videoElem.nativeElement.play();
      this.message = null;
    } else {
      this.stopVideo();
      this.webcamTestActive = false;
      this.message = 'جهت تست دوربین کلیک کنید';
    }
  }

  resetTest() {
    this.webcamTestActive = false;
    setTimeout(() => {
      this.message = 'جهت تست دوربین کلیک کنید';
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
    this.router.navigate(['/vc', roomId]);
  }
}
