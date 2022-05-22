import {Component, ElementRef, OnInit, Renderer2, ViewChild} from '@angular/core';
import {UpdateViewService} from '@core/utils';
import {SessionService} from '@core/http';

@Component({
  selector: 'ng-video-presentation',
  templateUrl: './video-presentation.component.html',
  styleUrls: ['./video-presentation.component.scss']
})
export class VideoPresentationComponent implements OnInit {

  @ViewChild('videoEl', {static: true}) videoEl: ElementRef;

  constructor(private updateViewService: UpdateViewService,
              private elementRef: ElementRef,
              private sessionService: SessionService,
              private renderer: Renderer2) {
  }

  ngOnInit(): void {
    this.updateViewService.getViewEvent().subscribe((res: any) => {
      switch (res.event) {
        case 'openBoard':
          this.activateVideo();
          break;
      }
    });

    if (this.sessionService.imTeacher) {
      this.videoEl.nativeElement.controls = true;
    }
    this.videoEl.nativeElement.onplay = (e) => {
      console.log('play', e.target.currentTime);
    };
    this.videoEl.nativeElement.onpause = (e) => {
      console.log('pause', e.target.currentTime);
    };
    this.videoEl.nativeElement.onseeking = (e) => {
      console.log('seeking', e.target.currentTime);
    };
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
}
