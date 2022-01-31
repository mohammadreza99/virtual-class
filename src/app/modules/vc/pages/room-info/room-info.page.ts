import {Component, ElementRef, HostListener, OnInit, ViewChild} from '@angular/core';
import {RoomService, SessionService} from '@core/http';
import {ActivatedRoute, Router} from '@angular/router';
import {Room} from '@core/models';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {NgMessage} from '@ng/models/overlay';
import {UtilsService} from '@ng/services';
import {NgDropdownItem} from '@ng/models/forms';

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

  @ViewChild('webcamPreview', {static: true}) webcamVideoElem: ElementRef;
  @ViewChild('micPreview', {static: true}) micVideoElem: ElementRef;
  @ViewChild('meter', {static: true}) volumeMeterElem: ElementRef;

  room: Room;
  videoStream: MediaStream;
  audioStream: MediaStream;
  limitMode: boolean = false;
  roomStatusMessage: NgMessage[];
  webcamTestMessage: string;
  micTestMessage: string;
  audioInputDevices: NgDropdownItem[];
  audioOutputDevices: NgDropdownItem[];
  videoInputDevices: NgDropdownItem[];
  selectedVideoInput: string;
  selectedAudioInput: string;
  selectedAudioOutput: string;
  showTestArea: boolean = false;
  speakerTestAudioElem = new Audio();

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
        this.room = result.data;
      }
      const token = this.route.snapshot.queryParamMap.get('t');
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('limitMode', 'true');
        this.limitMode = true;
      }
      await this.loadDevices();
      await this.startAudioStream();
      await this.startVideoStream();
      this.selectedVideoInput = this.videoInputDevices[0].value;
      this.selectedAudioInput = this.audioInputDevices[0].value;
      this.selectedAudioOutput = this.audioOutputDevices[0].value;
      await this.checkEnterRoomStatus();
    } catch (error) {
      console.error(error);
    }
  }

  toggleTestArea() {
    this.showTestArea = !this.showTestArea;
  }

  async enterRoom() {
    const result = await this.checkEnterRoomStatus();
    if (result) {
      this.stopVideo();
      this.stopAudio();
      localStorage.setItem('roomEnterTime', Date.now().toString());
      this.router.navigate(['/vc', this.room.id]);
    }
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
      this.audioStream = await navigator.mediaDevices.getUserMedia(constraints);
      if (!this.audioStream) {
        this.micTestMessage = 'micNotFound';
        return;
      }
    } catch (error) {
      if (error.name == 'NotAllowedError') {
        this.micTestMessage = 'pleaseAllowMic';
      } else {
        this.micTestMessage = 'micNotFound';
      }
      return;
    }
    this.micVideoElem.nativeElement.srcObject = this.audioStream;
    const audioContext = new AudioContext();
    const streamSource = audioContext.createMediaStreamSource(this.audioStream);
    const analyser = audioContext.createAnalyser();
    streamSource.connect(analyser);
    const pcmData = new Float32Array(analyser.fftSize);
    const onFrame = () => {
      analyser.getFloatTimeDomainData(pcmData);
      let sumSquares = 0.0;
      for (const amplitude of pcmData) {
        sumSquares += amplitude * amplitude;
      }
      this.volumeMeterElem.nativeElement.value = Math.sqrt(sumSquares / pcmData.length);
      window.requestAnimationFrame(onFrame);
    };
    window.requestAnimationFrame(onFrame);
  }

  async startVideoStream() {
    this.stopVideo();
    const videoSource = this.selectedVideoInput;
    const constraints = {
      video: {deviceId: videoSource ? {exact: videoSource} : undefined}
    };
    try {
      this.videoStream = await navigator.mediaDevices.getUserMedia(constraints);
      if (!this.videoStream) {
        this.webcamTestMessage = 'webcamNotFound';
        return;
      }
    } catch (error) {
      if (error.name == 'NotAllowedError') {
        this.webcamTestMessage = 'pleaseAllowMic';
      } else {
        this.webcamTestMessage = 'webcamNotFound';
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
    this.audioInputDevices = devices.filter(d => d.kind == 'audioinput').map((d, i) => ({
      label: d.label || `Microphone - ${i + 1}`,
      value: d.deviceId
    }));
    this.audioOutputDevices = devices.filter(d => d.kind == 'audiooutput').map((d, i) => ({
      label: d.label || `Webcam - ${i + 1}`,
      value: d.deviceId
    }));
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
    if (!this.room) {
      return false;
    }
    const result = await this.sessionService.userEnterStatus(this.room.id).toPromise();
    if (result.status != 'OK') {
      return false;
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

  sinkIsNotSupported() {
    return !('sinkId' in HTMLMediaElement.prototype);
  }

  // openToast(message: string) {
  //   this.utilsService.showToast({
  //     severity: 'warn',
  //     detail: this.translations[message]
  //   });
  // }
}
