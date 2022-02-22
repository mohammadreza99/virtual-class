import {Component, OnInit} from '@angular/core';
import {DynamicDialogConfig, DynamicDialogRef} from 'primeng/dynamicdialog';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {QuestionItem} from '@core/models';

@Component({
  selector: 'ng-question-result',
  templateUrl: './question-result.component.html',
  styleUrls: ['./question-result.component.scss']
})
export class QuestionResultComponent extends LanguageChecker implements OnInit {

  constructor(public dialogConfig: DynamicDialogConfig) {
    super();
  }

  question: QuestionItem;
  selected: any;

  ngOnInit(): void {
    const config = this.dialogConfig.data;
    config.question.options.forEach(o => {
      const isCorrect = config.correctAnswers.findIndex(c => c == o.id) > -1;
      const isMyAnswer = config.myAnswers.findIndex(c => c == o.id) > -1;
      Object.assign(o, {correct: isCorrect, myAnswer: isMyAnswer});
    });
    this.question = this.dialogConfig.data.question;
  }
}
