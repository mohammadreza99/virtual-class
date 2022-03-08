import {Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {RoomService, SessionService} from '@core/http';
import {ActivatedRoute, Router} from '@angular/router';
import {Room, RoomUser} from '@core/models';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {NgMessage} from '@ng/models/overlay';
import {UtilsService} from '@ng/services';
import {NgDropdownItem} from '@ng/models/forms';

@Component({
  selector: 'ng-room-info',
  templateUrl: './room-info.page.html',
  styleUrls: ['./room-info.page.scss']
})
export class RoomInfoPage extends LanguageChecker implements OnInit, OnDestroy {
  constructor(private roomService: RoomService,
              private sessionService: SessionService,
              private utilsService: UtilsService,
              private route: ActivatedRoute,
              private router: Router) {
    super();
  }

  @ViewChild('webcamPreview', {static: true}) webcamVideoElem: ElementRef;
  @ViewChild('micPreview', {static: true}) micVideoElem: ElementRef;
  @ViewChildren('meter') volumeMeterElem: QueryList<ElementRef>;

  room: Room;
  user: RoomUser;
  videoStream: MediaStream;
  audioStream: MediaStream;
  limitMode: boolean = false;
  roomStatusMessage: NgMessage[] = [];
  webcamTestMessage: string;
  micTestMessage: string;
  speakerTestMessage: string;
  audioInputDevices: NgDropdownItem[];
  audioOutputDevices: NgDropdownItem[];
  videoInputDevices: NgDropdownItem[];
  selectedVideoInput: string;
  selectedAudioInput: string;
  selectedAudioOutput: string;
  showTestArea: boolean = false;
  speakerTestAudioElem = new Audio();
  checkEnterRoomStatusInterval: any;
  disableEnterButton: boolean = false;

  ngOnInit(): void {
    this.loadData();
    this.webcamVideoElem.nativeElement.muted = true;
    this.micVideoElem.nativeElement.muted = true;
  }

  async loadData() {
    try {
      const roomId = +this.route.snapshot.paramMap.get('roomId');
      const result = await this.roomService.getRoomById(roomId).toPromise();
      if (result.status == 'OK') {
        this.room = result.data.room;
        this.user = result.data.member;
      }
      const token = this.route.snapshot.queryParamMap.get('t');
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('limitMode', 'true');
        this.limitMode = true;
      } else {
        localStorage.removeItem('limitMode');
      }
      await this.loadDevices();
      await this.checkEnterRoomStatus();
      await this.startAudioStream();
      await this.startVideoStream();
    } catch (error) {
      console.error(error);
    }
  }

  toggleTestArea() {
    this.showTestArea = !this.showTestArea;
  }

  async attachSinkId(element: any, sinkId: string) {
    if (typeof element.sinkId !== 'undefined') {
      await element.setSinkId(sinkId).catch(error => {
        let errorMessage = error;
        if (error.name === 'SecurityError') {
          errorMessage = `You need to use HTTPS for selecting audio output device: ${error}`;
        }
        console.error(errorMessage);
        this.selectedAudioOutput = this.audioOutputDevices[0].value;
      });
    } else {
      console.error('Browser does not support output device selection.');
    }
  }

  async startAudioStream() {
    this.stopAudio();
    const audioSource = this.selectedAudioInput;
    const constraints = {
      audio: {deviceId: audioSource ? {exact: audioSource} : undefined},
    };
    try {
      this.audioStream = await this.sessionService.getUserMedia(constraints);
      if (!this.audioStream) {
        this.micTestMessage = 'room.micNotFound';
        return;
      }
    } catch (error) {
      if (error.name == 'NotAllowedError') {
        this.micTestMessage = 'room.pleaseAllowMic';
      } else {
        this.micTestMessage = 'room.micNotFound';
      }
      return;
    }
    this.micVideoElem.nativeElement.srcObject = this.audioStream;
    this.sessionService.checkIsTalking(this.audioStream, (value: number) => {
      this.volumeMeterElem.toArray().forEach(el => {
        el.nativeElement.value = value;
      });
    });
  }

  async startVideoStream() {
    this.stopVideo();
    const videoSource = this.selectedVideoInput;
    const constraints = {
      video: {deviceId: videoSource ? {exact: videoSource} : undefined}
    };
    try {
      this.videoStream = await this.sessionService.getUserMedia(constraints);
      if (!this.videoStream) {
        this.webcamTestMessage = 'room.webcamNotFound';
        return;
      }
    } catch (error) {
      if (error.name == 'NotAllowedError') {
        this.webcamTestMessage = 'room.pleaseAllowWebcam';
      } else {
        this.webcamTestMessage = 'room.webcamNotFound';
      }
      return;
    }
    this.webcamVideoElem.nativeElement.srcObject = this.videoStream;
  }

  async loadDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    this.videoInputDevices = devices.filter(d => d.kind == 'videoinput').map((d, i) => ({
      label: d.label || `Webcam - ${i + 1}`,
      value: d.deviceId
    }));
    if (this.videoInputDevices.length == 0) {
      this.webcamTestMessage = 'room.webcamNotFound';
    }
    this.audioInputDevices = devices.filter(d => d.kind == 'audioinput').map((d, i) => ({
      label: d.label || `Microphone - ${i + 1}`,
      value: d.deviceId
    }));
    if (this.audioInputDevices.length == 0) {
      this.micTestMessage = 'room.micNotFound';
    }
    this.audioOutputDevices = devices.filter(d => d.kind == 'audiooutput').map((d, i) => ({
      label: d.label || `Speaker - ${i + 1}`,
      value: d.deviceId
    }));
    if (this.audioOutputDevices.length == 0) {
      this.speakerTestMessage = 'room.speakerNotFound';
    }
    this.selectedVideoInput = this.videoInputDevices[0]?.value;
    this.selectedAudioInput = this.audioInputDevices[0]?.value;
    this.selectedAudioOutput = this.audioOutputDevices[0]?.value;
  }

  stopVideo() {
    this.webcamVideoElem.nativeElement.pause();
    this.webcamVideoElem.nativeElement.srcObject = null;
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => {
        track.stop();
      });
    }
  }

  stopAudio() {
    this.micVideoElem.nativeElement.pause();
    this.micVideoElem.nativeElement.srcObject = null;
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => {
        track.stop();
      });
    }
  }

  onChangeVideoInput(event: any) {
    this.selectedVideoInput = event.value;
    this.startVideoStream();
  }

  onChangeAudioInput(event: any) {
    this.selectedAudioInput = event.value;
    this.startAudioStream();
  }

  onChangeAudioOutput(event: any) {
    this.selectedAudioOutput = event.value;
    this.attachSinkId(this.speakerTestAudioElem, this.selectedAudioOutput);
  }

  playAudio() {
    if (this.speakerTestAudioElem) {
      this.speakerTestAudioElem.pause();
    }
    this.speakerTestAudioElem.src = 'assets/files/audio.mp3';
    this.speakerTestAudioElem.load();
    this.speakerTestAudioElem.play();
    this.speakerTestAudioElem.onended = () => {
      this.speakerTestAudioElem.pause();
    };
  }

  async checkEnterRoomStatus() {
    const checkEnterRoomStatus = await this.getEnterRoomStatus();
    if (checkEnterRoomStatus) {
      switch (checkEnterRoomStatus.enter_status) {
        case 'RoomNotStarted':
          this.roomStatusMessage = [{severity: 'warn', detail: this.instant('room.roomIsNotStarted')}];
          this.disableEnterButton = true;
          break;
        default:
          this.roomStatusMessage = [{severity: 'warn', detail: this.instant('room.roomIsInHold')}];
          this.disableEnterButton = false;
          break;
      }
    }
    this.clearCheckEnterRoomStatusInterval();
    this.checkEnterRoomStatusInterval = setInterval(() => {
      this.checkEnterRoomStatus();
    }, 10000);
  }

  async getEnterRoomStatus() {
    if (!this.room) {
      return;
    }
    if (this.user.role == 'Admin') {
      return;
    }
    const result = await this.sessionService.userEnterStatus(this.room.id).toPromise();
    if (result.status != 'OK') {
      return;
    }
    return result.data;
  }

  sinkIsNotSupported() {
    return !('sinkId' in HTMLMediaElement.prototype);
  }

  async enterRoom(callback: () => any) {
    const result = await this.getEnterRoomStatus();
    callback();
    if (result) {
      switch (result.enter_status) {
        case 'Kicked':
          this.utilsService.showDialog({message: this.instant('room.yourKickedUntilEndSession')});
          return;
        case 'TemporaryKicked':
          const kickTime = Math.round(+result.kick_time / 60);
          const message = this.translationService.instant('room.yourTemporaryKicked', {value: kickTime}) as string;
          this.utilsService.showDialog({message});
          return;
        case 'RoomNotStarted':
          return;
      }
    }
    this.stopVideo();
    this.stopAudio();
    localStorage.setItem('roomEnterTime', Date.now().toString());
    this.clearCheckEnterRoomStatusInterval();
    this.router.navigate(['/vc', this.room.id]);
  }

  goBack() {
    this.stopAudio();
    this.stopVideo();
    this.router.navigateByUrl('/rooms/list');
  }

  clearCheckEnterRoomStatusInterval() {
    if (this.checkEnterRoomStatusInterval) {
      clearInterval(this.checkEnterRoomStatusInterval);
    }
  }

  ngOnDestroy() {
    this.clearCheckEnterRoomStatusInterval();
  }
}
