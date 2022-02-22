import {Component, OnInit} from '@angular/core';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {DynamicDialogConfig, DynamicDialogRef} from 'primeng/dynamicdialog';

@Component({
  selector: 'ng-upload-file',
  templateUrl: './upload-file.component.html',
  styleUrls: ['./upload-file.component.scss']
})
export class UploadFileComponent extends LanguageChecker implements OnInit {

  constructor(public dialogConfig: DynamicDialogConfig,
              private dialogRef: DynamicDialogRef) {
    super();
  }

  allowDownload: boolean = false;
  selected: any;
  validFileTypes: string = '.pdf,.doc,.docx,.pptx,.jpg,.png,.jpeg,.xlsx';
  maxFileSize: number = 2000;

  ngOnInit(): void {
  }

  onSelect(event) {
    if (event.target.files[0]) {
      this.selected = event.target.files[0];
    }
    console.log(this.isFileTypeValid(this.selected));
    console.log(this.isFileSizeValid(this.selected));
  }

  onSubmit() {

  }

  onClose() {
    this.dialogRef.close(null);
  }

  removeFile(event) {
    event.stopPropagation();
    this.selected = null;
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
}
