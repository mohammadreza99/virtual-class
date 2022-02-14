import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {SessionService} from '@core/http';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {UtilsService} from '@ng/services';
import {PollItem, QuestionState} from '@core/models';

@Component({
  selector: 'ng-poll-management',
  templateUrl: './poll-management.component.html',
  styleUrls: ['./poll-management.component.scss']
})
export class PollManagementComponent extends LanguageChecker implements OnInit {

  constructor(private sessionService: SessionService,
              private utilsService: UtilsService) {
    super();
  }

  @Input('visible') set setVisible(v: number) {
    if (!v) {
      this.resetForm();
    }
  };

  @Input() activePollId: number;
  @Output() visibleChange = new EventEmitter();
  @Output() published = new EventEmitter();
  @Output() finished = new EventEmitter();
  @Output() canceled = new EventEmitter();

  form = new FormGroup({
    description: new FormControl(null, Validators.required),
    multiple_choice: new FormControl(false),
    publish_result: new FormControl(false),
    options: new FormArray([this.createOptionControl(), this.createOptionControl()], this.pollValidator)
  });
  archivePolls: any[] = [];
  currentState: 'modify' | 'result' | 'archive' = 'modify';
  pollStarted: boolean = false;
  activePoll: PollItem;

  ngOnInit(): void {
    this.loadData();
  }

  async loadData() {
    if (this.activePollId) {
      this.pollStarted = true;
      await this.updatePollResult();
      this.goToState('result');
    }
    this.getArchivePolls();
  }

  async getArchivePolls() {
    try {
      const result = await this.sessionService.getArchivedPolls().toPromise();
      if (result.status == 'OK') {
        this.archivePolls = result.data.items;
      }
    } catch (e) {
      console.error(e);
    }
  }

  createOptionControl() {
    return new FormGroup({
      description: new FormControl(null, Validators.required),
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
    this.goToState(this.pollStarted ? 'result' : 'modify');
  }

  pollValidator(array: FormArray) {
    const controls = Object.values(array.controls) as FormGroup[];
    const isValid = controls.every(g => g.get('description').value);
    return isValid ? null : {isInvalid: true};
  }

  async onSubmit(callback: any) {
    try {
      const result = await this.sessionService.addPoll(this.form.value).toPromise();
      if (result.status == 'OK') {
        this.pollStarted = true;
        const pollResult = await this.sessionService.getPollResult(result.data.poll.id).toPromise();
        if (pollResult.status == 'OK') {
          this.activePoll = pollResult.data.poll;
        }
        this.goToState('result');
        this.resetForm();
        this.published.emit(this.activePoll.id);
      }
      callback();
    } catch (e) {
      console.error(e);
      callback();
    }
  }

  async changePollState(state: QuestionState, callback?: any) {
    try {
      const result = await this.sessionService.changePollPublishState(this.activePoll.id, state).toPromise();
      if (result.status == 'OK') {
        this.pollStarted = false;
        this.activePoll.state = state;
        this[state.toLowerCase()].emit();
        this.getArchivePolls();
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

  async updatePollResult(callback?: any) {
    try {
      const result = await this.sessionService.getPollResult(this.activePollId).toPromise();
      if (result.status == 'OK') {
        this.activePoll = result.data.poll;
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

  async revokePoll() {
    const dialogRes = await this.utilsService.showConfirm({
      header: this.translations.room.revokePoll,
      message: this.translations.room.revokePollConfirm,
      rtl: this.fa
    });
    if (dialogRes) {
      this.changePollState('Canceled');
    }
  }

  goToState(state: 'modify' | 'result' | 'archive') {
    this.currentState = state;
  }

  async getArchiveDetail(event: any) {
    const p = this.archivePolls[event.index];
    const result = await this.sessionService.getPollResult(p.id).toPromise();
    if (result.status == 'OK') {
      p.options = result.data.poll.options;
    }
  }

  close() {
    this.resetForm();
    if (!this.pollStarted) {
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
    this.form.reset({multiple_choice: false, publish_result: false});
  }
}
