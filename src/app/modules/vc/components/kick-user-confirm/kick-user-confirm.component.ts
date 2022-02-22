import {Component, OnInit} from '@angular/core';
import {DynamicDialogConfig, DynamicDialogRef} from 'primeng/dynamicdialog';
import {SelectItem} from 'primeng/api';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';

@Component({
  selector: 'ng-kick-user-confirm',
  templateUrl: './kick-user-confirm.component.html',
  styleUrls: ['./kick-user-confirm.component.scss']
})
export class KickUserConfirmComponent extends LanguageChecker implements OnInit {
  kickOptions: SelectItem[] = [
    {label: this.translations.room.temporaryKick, value: 600},
    {label: this.translations.room.kickFromCurrentRoom, value: null},
  ];
  kickTime: number = null;

  constructor(private dialogConfig: DynamicDialogConfig,
              private dialogRef: DynamicDialogRef) {
    super();
  }


  ngOnInit(): void {
  }

  onClose() {
    this.dialogRef.close(false);
  }

  onSubmit() {
    this.dialogRef.close(this.kickTime);
  }
}
