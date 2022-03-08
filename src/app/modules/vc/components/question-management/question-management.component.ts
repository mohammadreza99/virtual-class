import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {SessionService} from '@core/http';
import {Subscription} from 'rxjs';
import {UtilsService} from '@ng/services';
import {QuestionItem, QuestionState} from '@core/models';

@Component({
  selector: 'ng-question-management',
  templateUrl: './question-management.component.html',
  styleUrls: ['./question-management.component.scss']
})
export class QuestionManagementComponent extends LanguageChecker implements OnInit {

  constructor(private sessionService: SessionService,
              private utilsService: UtilsService) {
    super();
  }

  @Input('visible') set setVisible(v: number) {
    if (!v) {
      this.resetForm();

      if (!this.questionStarted) {
        this.goToState('modify');
      }
    }
  };

  @Input() activeQuestionId: number;
  @Output() visibleChange = new EventEmitter();
  @Output() published = new EventEmitter();
  @Output() finished = new EventEmitter();
  @Output() canceled = new EventEmitter();

  form = new FormGroup({
    description: new FormControl(null, Validators.required),
    options: new FormArray([this.createOptionControl(), this.createOptionControl()], this.questionValidator)
  });
  archiveQuestions: QuestionItem[] = [];
  currentState: 'modify' | 'result' | 'archive' = 'modify';
  questionStarted: boolean = false;
  activeQuestion: QuestionItem;

  ngOnInit(): void {
    this.loadData();
  }

  async loadData() {
    if (this.activeQuestionId) {
      this.questionStarted = true;
      await this.updateQuestionResult();
      this.goToState('result');
    }
    this.getArchiveQuestions();
  }

  async getArchiveQuestions() {
    try {
      const result = await this.sessionService.getArchivedQuestions().toPromise();
      if (result.status == 'OK') {
        this.archiveQuestions = result.data.items.reverse();
      }
    } catch (e) {
      console.error(e);
    }
  }

  createOptionControl() {
    return new FormGroup({
      description: new FormControl(null, Validators.required),
      correct_answer: new FormControl(false)
    });
  }

  addOption() {
    const options = this.form.get('options') as FormArray;
    options.push(this.createOptionControl());
  }

  deleteOption(i) {
    const options = this.form.get('options') as FormArray;
    options.removeAt(i);
  }

  goBack() {
    this.goToState(this.questionStarted ? 'result' : 'modify');
  }

  questionValidator(array: FormArray) {
    const controls = Object.values(array.controls) as FormGroup[];
    const isValid = controls.every(g => g.get('description').value) && controls.some(g => g.get('correct_answer').value == true);
    return isValid ? null : {isInvalid: true};
  }

  async onSubmit(callback: any) {
    try {
      const formValue = this.form.value;
      const result = await this.sessionService.addQuestion(formValue.description, formValue.options).toPromise();
      if (result.status == 'OK') {
        this.questionStarted = true;
        const questionResult = await this.sessionService.getQuestionResult(result.data.question.id).toPromise();
        if (questionResult.status == 'OK') {
          this.activeQuestion = questionResult.data.question;
        }
        this.goToState('result');
        this.resetForm();
        this.published.emit(this.activeQuestion.id);
      }
      callback();
    } catch (e) {
      console.error(e);
      callback();
    }
  }

  async changeQuestionState(state: QuestionState, callback?: any) {
    try {
      const result = await this.sessionService.changeQuestionPublishState(this.activeQuestion.id, state).toPromise();
      if (result.status == 'OK') {
        this.questionStarted = false;
        this.activeQuestion.state = state;
        this[state.toLowerCase()].emit();
        this.updateQuestionResult();
        this.getArchiveQuestions();
      }
      if (callback) {
        callback();
      }
    } catch (e) {
      console.error(e);
      if (callback) {
        callback();
      }
    }
  }

  async updateQuestionResult(callback?: any) {
    try {
      const result = await this.sessionService.getQuestionResult(this.activeQuestionId).toPromise();
      if (result.status == 'OK') {
        this.activeQuestion = result.data.question;
      }
      if (callback) {
        callback();
      }
    } catch (error) {
      console.error(error);
      if (callback) {
        callback();
      }
    }
  }

  async revokeQuestion() {
    const dialogRes = await this.utilsService.showConfirm({
      header: this.instant('room.revokeQuestion'),
      message: this.instant('room.revokeQuestionConfirm'),
      rtl: this.fa
    });
    if (dialogRes) {
      this.changeQuestionState('Canceled');
    }
  }

  goToState(state: 'modify' | 'result' | 'archive') {
    this.currentState = state;
  }

  async getArchiveDetail(event: any) {
    const q = this.archiveQuestions[event.index];
    const result = await this.sessionService.getQuestionResult(q.id).toPromise();
    if (result.status == 'OK') {
      q.options = result.data.question.options;
    }
  }

  close() {
    this.resetForm();
    if (!this.questionStarted) {
      this.goToState('modify');
    }
    this.visibleChange.emit();
  }

  resetForm() {
    const array = this.form.get('options') as FormArray;
    while (array.length !== 0) {
      array.removeAt(0);
    }
    array.push(this.createOptionControl());
    array.push(this.createOptionControl());
    this.form.reset({options: [{correct_answer: false}, {correct_answer: false}]});
  }
}
