import {Component, OnInit} from '@angular/core';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {DynamicDialogConfig, DynamicDialogRef} from 'primeng/dynamicdialog';
import {ImageCroppedEvent} from 'ngx-image-cropper';

@Component({
  selector: 'ng-upload-avatar',
  templateUrl: './upload-avatar.component.html',
  styleUrls: ['./upload-avatar.component.scss']
})
export class UploadAvatarComponent extends LanguageChecker implements OnInit {

  constructor(public dialogConfig: DynamicDialogConfig,
              private dialogRef: DynamicDialogRef,) {
    super();
  }

  imageChangedEvent: any = '';
  croppedBase64: any;
  imageURL: any;

  ngOnInit(): void {
    if (this.dialogConfig.data?.avatar) {
      this.imageURL = this.dialogConfig.data.avatar;
    }
  }

  imageCropped(event: ImageCroppedEvent) {
    this.croppedBase64 = event.base64;
  }

  base64toFile(dataurl: any, filename: string): File {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type: mime});
  }

  onDelete() {
    this.dialogRef.close('delete');
  }

  onSelect(event) {
    if (event.target.files[0]) {
      this.imageChangedEvent = event;
    }
  }

  onSubmit() {
    this.dialogRef.close({
      base64: this.croppedBase64,
      file: this.base64toFile(this.croppedBase64, this.croppedBase64.split('/').pop()),
    });
  }

  loadImageFailed() {
    this.imageChangedEvent = null;
    this.imageURL = null;
  }
}
