import {Component, OnInit} from '@angular/core';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {DynamicDialogConfig, DynamicDialogRef} from 'primeng/dynamicdialog';
import {UpdateViewService} from '@core/http/update-view.service';

@Component({
  selector: 'ng-poll-income',
  templateUrl: './poll-income.component.html',
  styleUrls: ['./poll-income.component.scss']
})
export class PollIncomeComponent extends LanguageChecker implements OnInit {

  constructor(public dialogConfig: DynamicDialogConfig,
              private dialogRef: DynamicDialogRef,
              private updateViewService: UpdateViewService) {
    super();
  }

  poll: any;
  selectedOptions: number[];

  ngOnInit(): void {
    this.poll = this.dialogConfig.data;
    this.updateViewService.getViewEvent().subscribe(res => {
      switch (res.event) {
        case 'finishedPoll':
        case 'canceledPoll':
          this.dialogRef.close(null);
          break;
      }
    });
  }

  onSubmit() {
    const result = this.selectedOptions.map(o => ({poll_option_id: o}));
    this.dialogRef.close(result);
  }
}
