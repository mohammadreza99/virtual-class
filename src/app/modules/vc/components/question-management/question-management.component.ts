import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {SessionService} from '@core/http';
import {Subscription} from 'rxjs';
import {UtilsService} from '@ng/services';

@Component({
  selector: 'ng-question-management',
  templateUrl: './question-management.component.html',
  styleUrls: ['./question-management.component.scss']
})
export class QuestionManagementComponent extends LanguageChecker implements OnInit, OnDestroy {

  constructor(private sessionService: SessionService, private utilsService: UtilsService) {
    super();
  }

  @Input() activeQuestionId: number;
  @Output() closeSidebar = new EventEmitter();
  @Output() published = new EventEmitter();
  @Output() finished = new EventEmitter();
  @Output() canceled = new EventEmitter();

  form = new FormGroup({
    description: new FormControl(null, Validators.required),
    options: new FormArray([this.createOptionControl(), this.createOptionControl()], this.questionValidator)
  });
  archiveQuestions: any[] = [];
  currentState: 'modify' | 'result' | 'archive' = 'modify';
  questionStarted: boolean = false;
  activeQuestion: any;

  // updateQuestionTimer: any;

  ngOnInit(): void {
    this.loadData();
  }

  async loadData() {
    if (this.activeQuestionId) {
      this.questionStarted = true;
      await this.updateQuestionResult();
      this.currentState = 'result';
      // this.updateQuestionTimer = setTimeout(() => {
      //   this.updateQuestionResult();
      // }, 5000);
    }
    this.getArchiveQuestions();
  }

  async getArchiveQuestions() {
    try {
      const result = await this.sessionService.getArchivedQuestions().toPromise();
      if (result.status == 'OK') {
        this.archiveQuestions = result.data.items;
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
    this.currentState = this.questionStarted ? 'result' : 'modify';
  }

  showArchive() {
    this.currentState = 'archive';
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
        this.currentState = 'result';
        this.form.reset({options: [{correct_answer: false}, {correct_answer: false}]});
        this.published.emit(this.activeQuestion.id);
        // this.updateQuestionTimer = setTimeout(() => {
        //   this.updateQuestionResult();
        // }, 5000);
        callback();
      }
    } catch (e) {
      console.error(e);
      callback();
    }
  }

  async changeQuestionState(state: string, callback?: any) {
    try {
      const result = await this.sessionService.changeQuestionPublishState(this.activeQuestion.id, state).toPromise();
      if (result.status == 'OK') {
        if (callback) {
          callback();
        }
        this.questionStarted = false;
        this.currentState = 'result';
        // clearTimeout(this.updateQuestionTimer);
        this[state.toLowerCase()].emit();
        this.getArchiveQuestions();
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
        if (callback) {
          callback();
        }
        this.activeQuestion = result.data.question;
      }
    } catch (error) {
      console.error(error);
      if (callback) {
        callback();
      }
    }
  }

  ngOnDestroy() {
    // clearTimeout(this.updateQuestionTimer);
  }

  async revokeQuestion() {
    const dialogRes = await this.utilsService.showConfirm({
      header: this.translations.room.revokeQuestion,
      message: this.translations.room.revokeQuestionConfirm,
      rtl: this.fa
    });
    if (dialogRes) {
      this.changeQuestionState('Canceled');
    }
  }
}
