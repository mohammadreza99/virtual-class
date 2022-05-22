import {Component, OnDestroy, OnInit} from '@angular/core';
import {DynamicDialogConfig, DynamicDialogRef} from 'primeng/dynamicdialog';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {UpdateViewService} from '@core/utils';
import {Subject, Subscription} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'ng-question-income',
  templateUrl: './question-income.component.html',
  styleUrls: ['./question-income.component.scss']
})
export class QuestionIncomeComponent extends LanguageChecker implements OnInit, OnDestroy {

  constructor(public dialogConfig: DynamicDialogConfig,
              private dialogRef: DynamicDialogRef,
              private updateViewService: UpdateViewService) {
    super();
  }

  destroy$: Subject<boolean> = new Subject<boolean>();
  question: any;
  selectedOption: any;
  subscription: Subscription;

  ngOnInit(): void {
    this.question = this.dialogConfig.data;
    this.subscription = this.updateViewService.getViewEvent().pipe(takeUntil(this.destroy$)).subscribe(res => {
      switch (res.event) {
        case 'finishedQuestion':
        case 'canceledQuestion':
          this.dialogRef.close(null);
          break;
      }
    });
  }

  onSubmit() {
    this.dialogRef.close([{question_option_id: this.selectedOption}]);
    this.subscription.unsubscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
