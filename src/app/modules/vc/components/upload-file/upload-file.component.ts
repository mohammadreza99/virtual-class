import {Component, OnDestroy, OnInit} from '@angular/core';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {DynamicDialogConfig, DynamicDialogRef} from 'primeng/dynamicdialog';
import {SessionService} from '@core/http';
import {HttpEvent, HttpEventType} from '@angular/common/http';
import {error} from 'protractor';
import {takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';

@Component({
  selector: 'ng-upload-file',
  templateUrl: './upload-file.component.html',
  styleUrls: ['./upload-file.component.scss']
})
export class UploadFileComponent extends LanguageChecker implements OnInit, OnDestroy {

  constructor(public dialogConfig: DynamicDialogConfig,
              private dialogRef: DynamicDialogRef,
              private sessionService: SessionService) {
    super();
  }

  allowDownload: boolean = false;
  selected: File;
  validFileTypes: string = '.pdf,.doc,.docx,.pptx,.jpg,.png,.jpeg,.xlsx';
  maxFileSize: number = 10485760;
  invalidSize: boolean;
  invalidType: boolean;
  uploadProgress: number;
  destroy$: Subject<boolean> = new Subject<boolean>();

  ngOnInit(): void {
  }

  onSelect(event: any) {
    if (!event.target.files) {
      return;
    }
    this.selected = event.target.files[0];
    this.invalidSize = !this.isFileSizeValid(this.selected);
    this.invalidType = !this.isFileTypeValid(this.selected);
  }

  async onSubmit() {
    const {
      data,
      status
    } = await this.sessionService.getPresentationPolicy(this.selected.name).toPromise();
    if (status == 'OK') {
      this.uploadProgress = 1;
      this.sessionService.uploadPresentation(data.upload_policy.main_url, {
        ...data.upload_policy,
        file: this.selected
      }).pipe(takeUntil(this.destroy$)).subscribe(async (event: HttpEvent<any>) => {
        switch (event.type) {
          case HttpEventType.Response:
            const uploadRes = await this.sessionService.uploadPresentationCompleted(data.presentation_id).toPromise();
            if (uploadRes.status == 'OK') {
              await this.sessionService.changePresentationState(data.presentation_id, 'Open').toPromise();
              this.uploadProgress = 0;
              this.selected = null;
              this.dialogRef.close();
              this.destroy$.next(true);
            }
            break;
        }
      }, (error) => {
        this.uploadProgress = 0;
        this.selected = null;
      });
    }
  }

  onClose() {
    this.dialogRef.close(null);
  }

  removeFile(event) {
    event.stopPropagation();
    this.selected = null;
    this.invalidSize = false;
    this.invalidType = false;
  }

  isFileTypeValid(file: File): boolean {
    const acceptableTypes = this.validFileTypes.split(',').map(type => type.trim());
    for (const type of acceptableTypes) {
      const acceptable = this.isWildcard(type) ? this.getTypeClass(file.type) === this.getTypeClass(type)
        : file.type == type || this.getFileExtension(file).toLowerCase() === type.toLowerCase();
      if (acceptable) {
        return true;
      }
    }
    return false;
  }

  isFileSizeValid(file: File) {
    return file.size <= this.maxFileSize;
  }

  isWildcard(fileType: string): boolean {
    return fileType.indexOf('*') !== -1;
  }

  getTypeClass(fileType: string): string {
    return fileType.substring(0, fileType.indexOf('/'));
  }

  getFileExtension(file: File): string {
    return '.' + file.name.split('.').pop();
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
