import {Component, OnDestroy, OnInit} from '@angular/core';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {DynamicDialogConfig, DynamicDialogRef} from 'primeng/dynamicdialog';
import {UpdateViewService} from '@core/http/update-view.service';
import {PollItem} from '@core/models';
import {takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';

@Component({
  selector: 'ng-poll-income',
  templateUrl: './poll-income.component.html',
  styleUrls: ['./poll-income.component.scss']
})
export class PollIncomeComponent extends LanguageChecker implements OnInit, OnDestroy {

  constructor(public dialogConfig: DynamicDialogConfig,
              private dialogRef: DynamicDialogRef,
              private updateViewService: UpdateViewService) {
    super();
  }

  destroy$: Subject<boolean> = new Subject<boolean>();
  poll: PollItem;
  selectedOptions: any;

  ngOnInit(): void {
    this.poll = this.dialogConfig.data;
    this.updateViewService.getViewEvent().pipe(takeUntil(this.destroy$)).subscribe(res => {
      switch (res.event) {
        case 'finishedPoll':
        case 'canceledPoll':
          this.dialogRef.close(null);
          break;
      }
    });
  }

  onSubmit() {
    let result: any;
    if (Array.isArray(this.selectedOptions)) {
      result = this.selectedOptions.map(o => ({poll_option_id: o}));
    } else {
      result = [{poll_option_id: this.selectedOptions}];
    }
    this.dialogRef.close(result);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
