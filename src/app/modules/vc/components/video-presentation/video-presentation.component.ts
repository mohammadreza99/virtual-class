import {AfterViewInit, Component, ElementRef, OnInit, Renderer2, ViewChild} from '@angular/core';
import {UpdateViewService} from '@core/utils';
import {SessionService} from '@core/http';

@Component({
  selector: 'ng-video-presentation',
  templateUrl: './video-presentation.component.html',
  styleUrls: ['./video-presentation.component.scss']
})
export class VideoPresentationComponent implements AfterViewInit {

  constructor(private updateViewService: UpdateViewService,
              private elementRef: ElementRef,
              private sessionService: SessionService,
              private renderer: Renderer2) {
  }

  presentationData: any;

  ngAfterViewInit() {
    const videoEl = this.elementRef.nativeElement.querySelector('video');
    const source = videoEl.querySelector('source');
    this.updateViewService.getViewEvent().subscribe((res: any) => {
      switch (res.event) {
        case 'openPresentation':
          if (!res.data.is_video) {
            return;
          }
          this.presentationData = res.data;
          this.activateVideo();

          source.setAttribute('src', res.data.pages[1]);
          videoEl.load();
          break;

        case 'closePresentation':
          if (!res.data.is_video) {
            return;
          }
          this.deactivateVideo();
          videoEl.pause();
          source.setAttribute('src', null);
          break;

        case 'videoAction':
          if (this.sessionService.imTeacher) {
            return;
          }
          const {operation, time} = res.data.action;
          switch (operation) {
            case 'play':
              if (videoEl.paused) {
                videoEl.play();
              }
              break;

            case 'pause':
              if (videoEl.play) {
                videoEl.pause();
              }
              break;

            case 'seek':
              videoEl.currentTime = time;
              break;
          }
          break;
      }
    });
    if (this.sessionService.imTeacher) {
      this.initVideoPlayerListeners();
    }
  }

  activateVideo() {
    this.renderer.addClass(this.elementRef.nativeElement, 'active');
  }

  deactivateVideo() {
    this.renderer.removeClass(this.elementRef.nativeElement, 'active');
  }

  onContextMenu(event: Event) {
    event.preventDefault();
    return;
  }

  close() {
    this.sessionService.changePresentationState(this.presentationData.presentation_id, 'Close').toPromise();
  }

  downloadFile() {
    this.sessionService.downloadLink(this.presentationData.file_url);
  }


  initVideoPlayerListeners() {
    const videoContainer = this.elementRef.nativeElement.querySelector('.wrapper');
    const video = videoContainer.querySelector('video');
    const videoControls = videoContainer.querySelector('.video-controls');
    const progressBar = videoContainer.querySelector('.progress-bar');
    const progress = videoContainer.querySelector('.time-bar');
    const bufferBar = videoContainer.querySelector('.buffer-bar');
    const playButton = videoContainer.querySelector('.play-button');
    const soundButton = videoContainer.querySelector('.sound-button');
    const currentTime = videoContainer.querySelector('.current-time');
    const duration = videoContainer.querySelector('.duration');
    const volumeBar = videoContainer.querySelector('.actions input');
    video.volume = 0.7;
    let timeDrag = false;

    const togglePlay = async () => {
      if (video.paused) {
        video.play();
        await this.sessionService.videoAction('play', video.currentTime).toPromise();
        this.renderer.addClass(videoControls, 'playing');
      } else {
        video.pause();
        await this.sessionService.videoAction('pause', video.currentTime).toPromise();
        this.renderer.removeClass(videoControls, 'playing');
      }
    };

    const timeFormat = (seconds) => {
      const m: any = Math.floor(seconds / 60) < 10
        ? '0' + Math.floor(seconds / 60)
        : Math.floor(seconds / 60);
      const s = Math.floor(seconds - m * 60) < 10
        ? '0' + Math.floor(seconds - m * 60)
        : Math.floor(seconds - m * 60);
      return m + ':' + s;
    };

    const startBuffer = () => {
      const currentBuffer = video.buffered.end(0);
      const maxDuration = video.duration;
      const percent = 100 * currentBuffer / maxDuration;
      bufferBar.style.width = percent + '%';

      if (currentBuffer < maxDuration) {
        setTimeout(startBuffer, 500);
      }
    };

    const updatebar = (x) => {
      const position = x - progress.offsetLeft;
      let percentage = 100 * position / progressBar.offsetWidth;
      if (percentage > 100) {
        percentage = 100;
      }
      if (percentage < 0) {
        percentage = 0;
      }
      progress.style.width = percentage + '%';
      video.currentTime = video.duration * percentage / 100;
    };

    video.addEventListener('loadedmetadata', (e) => {
      currentTime.innerHTML = timeFormat(0);
      duration.innerHTML = timeFormat(video.duration);
      setTimeout(startBuffer, 150);
    });

    video.addEventListener('click', () => {
      togglePlay();
    });

    video.addEventListener('timeupdate', () => {
      currentTime.innerHTML = timeFormat(video.currentTime);
      duration.innerHTML = timeFormat(video.duration);
      const percent = 100 * video.currentTime / video.duration;
      progress.style.width = percent + '%';
    });

    videoContainer.addEventListener('mouseleave', () => {
      if (video.paused === false) {
        this.renderer.addClass(videoContainer, 'playing');
      }
    });

    volumeBar?.addEventListener('input', (e) => {
      video.volume = e.target.value / 100;
    });

    playButton?.addEventListener('click', () => {
      togglePlay();
    });

    soundButton?.addEventListener('click', (e) => {
      video.muted = !video.muted;
      if (video.muted) {
        this.renderer.addClass(e.target, 'sound-muted');
        volumeBar.value = 0;
      } else {
        this.renderer.removeClass(e.target, 'sound-muted');
        volumeBar.value = video.volume * 100;
      }
    });

    progressBar?.addEventListener('mousedown', (e) => {
      timeDrag = true;
      updatebar(e.pageX);
    });

    this.elementRef.nativeElement.addEventListener('mouseup', (e) => {
      if (timeDrag) {
        timeDrag = false;
        updatebar(e.pageX);
        this.sessionService.videoAction('seek', video.currentTime).toPromise();
      }
    });

    this.elementRef.nativeElement.addEventListener('mousemove', (e) => {
      if (timeDrag) {
        updatebar(e.pageX);
      }
    });
  }
}
