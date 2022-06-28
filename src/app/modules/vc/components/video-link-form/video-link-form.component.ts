import {Component, OnInit} from '@angular/core';
import {DynamicDialogRef} from 'primeng/dynamicdialog';
import {FormControl, FormGroup, Validators} from '@angular/forms';

@Component({
  selector: 'ng-video-link-form',
  templateUrl: './video-link-form.component.html',
  styleUrls: ['./video-link-form.component.scss']
})
export class VideoLinkFormComponent implements OnInit {

  constructor(private dialogRef: DynamicDialogRef) {
  }

  form = new FormGroup({
    link: new FormControl(null, [Validators.required, Validators.pattern(/^https?:\/\/.*\/.*\.(mp4|avi|wmv|mov|mkv|flv|webm)\??.*$/gmi)])
  });

  ngOnInit(): void {
  }

  onSubmit() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value.link);
    }
  }

  onClose() {
    this.dialogRef.close(null);
  }

}
