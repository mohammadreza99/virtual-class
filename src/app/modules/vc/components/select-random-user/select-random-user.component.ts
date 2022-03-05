import {Component, OnInit} from '@angular/core';
import {RoomUser} from '@core/models';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {DynamicDialogConfig, DynamicDialogRef} from 'primeng/dynamicdialog';
import {SessionService} from '@core/http';

@Component({
  selector: 'ng-select-random-user',
  templateUrl: './select-random-user.component.html',
  styleUrls: ['./select-random-user.component.scss']
})
export class SelectRandomUserComponent extends LanguageChecker implements OnInit {

  constructor(public dialogConfig: DynamicDialogConfig,
              private dialogRef: DynamicDialogRef,
              private sessionService: SessionService) {
    super();
  }

  user: RoomUser;

  ngOnInit(): void {
    this.selectRandomUser();
  }

  async selectRandomUser() {
    this.user = await this.sessionService.getRandomUser();
  }

  onSubmit() {
    this.dialogRef.close(this.user);
  }

  onClose() {
    this.dialogRef.close();
  }
}
