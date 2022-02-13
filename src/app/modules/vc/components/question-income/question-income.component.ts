import {Component, OnInit} from '@angular/core';
import {DynamicDialogConfig, DynamicDialogRef} from 'primeng/dynamicdialog';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {UpdateViewService} from '@core/http/update-view.service';

@Component({
  selector: 'ng-question-income',
  templateUrl: './question-income.component.html',
  styleUrls: ['./question-income.component.scss']
})
export class QuestionIncomeComponent extends LanguageChecker implements OnInit {

  constructor(public dialogConfig: DynamicDialogConfig,
              private dialogRef: DynamicDialogRef,
              private updateViewService: UpdateViewService) {
    super();
  }

  question: any;
  selectedOption: any;

  ngOnInit(): void {
    this.question = this.dialogConfig.data;
    this.updateViewService.getViewEvent().subscribe(res => {
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
  }
}
