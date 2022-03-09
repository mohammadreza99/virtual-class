import {Component, OnDestroy, OnInit} from '@angular/core';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {DynamicDialogConfig, DynamicDialogRef} from 'primeng/dynamicdialog';
import {SessionService} from '@core/http';
import {HttpEvent, HttpEventType} from '@angular/common/http';
import {takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {UtilsService} from '@ng/services';

@Component({
  selector: 'ng-upload-file',
  templateUrl: './upload-file.component.html',
  styleUrls: ['./upload-file.component.scss']
})
export class UploadFileComponent extends LanguageChecker implements OnInit, OnDestroy {

  constructor(public dialogConfig: DynamicDialogConfig,
              private dialogRef: DynamicDialogRef,
              private utilsService: UtilsService,
              private sessionService: SessionService) {
    super();
  }

  allowDownload: boolean = false;
  selectedFile: File;
  validFileTypes: string = '.pdf,.doc,.docx,.pptx,.jpg,.png,.jpeg,.xlsx';
  minFileSize: number = 10240;
  maxFileSize: number = 10485760;
  invalidSize: boolean;
  invalidType: boolean;
  uploadProgress: boolean;
  activePresentations: any[];
  destroy$: Subject<boolean> = new Subject<boolean>();
  selectedPresentation: any;

  ngOnInit(): void {
    this.loadData();
  }

  async loadData() {
    const res = await this.sessionService.getActivePresentations().toPromise();
    if (res.status == 'OK') {
      this.activePresentations = res.data.items;
    }
  }

  onSelect(event: any) {
    if (!event.target.files) {
      return;
    }
    this.selectedFile = event.target.files[0];
    this.selectedPresentation = null;
    this.invalidSize = !this.isFileSizeValid(this.selectedFile);
    this.invalidType = !this.isFileTypeValid(this.selectedFile);
  }

  async onSubmit(callback: any) {
    try {
      if (this.selectedPresentation) {
        const res = await this.sessionService.changePresentationState(this.selectedPresentation.id, 'Open').toPromise();
        if (res.status == 'OK') {
          this.dialogRef.close();
        }
        callback();
        return;
      }
      const {
        data,
        status
      } = await this.sessionService.getPresentationPolicy(this.selectedFile.name, this.allowDownload).toPromise();
      if (status == 'OK') {
        this.uploadProgress = true;
        this.sessionService.uploadPresentation(data.upload_policy.main_url, {
          ...data.upload_policy,
          file: this.selectedFile
        }).pipe(takeUntil(this.destroy$)).subscribe(async (event: HttpEvent<any>) => {
          try {
            switch (event.type) {
              case HttpEventType.Response:
                const uploadRes = await this.sessionService.uploadPresentationCompleted(data.presentation_id).toPromise();
                if (uploadRes.status == 'OK') {
                  await this.sessionService.changePresentationState(data.presentation_id, 'Open').toPromise();
                  this.uploadProgress = false;
                  this.selectedFile = null;
                  this.dialogRef.close();
                  this.destroy$.next(true);
                }
                break;
            }
            callback();
          } catch (err) {
            console.error(err);
            callback();
            this.selectedFile = null;
            this.selectedPresentation = null;
            this.uploadProgress = false;
          }
        }, (err) => {
          console.error(err);
          this.uploadProgress = false;
          this.selectedFile = null;
          callback();
        });
      }
    } catch (err) {
      console.error(err);
      callback();
      this.selectedFile = null;
      this.selectedPresentation = null;
    }
  }

  onClose() {
    this.dialogRef.close(null);
  }

  removeFile(event) {
    event.stopPropagation();
    this.selectedFile = null;
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
    return file.size >= this.minFileSize && file.size <= this.maxFileSize;
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

  async deletePresentation(presentation: any) {
    const dialogRes = await this.utilsService.showConfirm({
      rtl: this.fa,
      header: this.instant('room.deletePresentationConfirm'),
      message: this.instant('room.deletePresentationConfirmBody')
    });
    if (dialogRes) {
      try {
        const res = await this.sessionService.deletePresentation(presentation.id).toPromise();
        if (res.status == 'OK') {
          this.activePresentations = this.activePresentations.filter(p => p.id != presentation.id);
        }
      } catch (err) {
        console.error(err);
      }
    }
  }

  onSelectPresentation(event: any) {
    this.selectedPresentation = event.value;
    this.selectedFile = null;
  }
}
