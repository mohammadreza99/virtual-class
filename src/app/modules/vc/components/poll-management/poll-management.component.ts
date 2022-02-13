import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {SessionService} from '@core/http';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {UtilsService} from '@ng/services';

@Component({
  selector: 'ng-poll-management',
  templateUrl: './poll-management.component.html',
  styleUrls: ['./poll-management.component.scss']
})
export class PollManagementComponent extends LanguageChecker implements OnInit, OnDestroy {

  constructor(private sessionService: SessionService,
              private utilsService: UtilsService) {
    super();
  }

  @Input() activePollId: number;
  @Output() closeSidebar = new EventEmitter();
  @Output() published = new EventEmitter();
  @Output() finished = new EventEmitter();
  @Output() canceled = new EventEmitter();

  form = new FormGroup({
    description: new FormControl(null, Validators.required),
    options: new FormArray([this.createOptionControl(), this.createOptionControl()], this.pollValidator)
  });
  archivePolls: any[] = [];
  currentState: 'modify' | 'result' | 'archive' = 'modify';
  pollStarted: boolean = false;
  activePoll: any;

  // updatePollTimer: any;

  ngOnInit(): void {
    this.loadData();
  }

  async loadData() {
    if (this.activePollId) {
      this.pollStarted = true;
      await this.updatePollResult();
      this.currentState = 'result';
      // this.updatePollTimer = setTimeout(() => {
      //   this.updatePollResult();
      // }, 5000);
    }
    this.getArchivePolls();
  }

  async getArchivePolls() {
    const result = await this.sessionService.getArchivedPolls().toPromise();
    if (result.status == 'OK') {
      this.archivePolls = result.data.items;
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
    this.currentState = this.pollStarted ? 'result' : 'modify';
  }

  showArchive() {
    this.currentState = 'archive';
  }

  pollValidator(array: FormArray) {
    const controls = Object.values(array.controls) as FormGroup[];
    const isValid = controls.every(g => g.get('description').value);
    return isValid ? null : {isInvalid: true};
  }

  async onSubmit(callback: any) {
    try {
      const formValue = this.form.value;
      const result = await this.sessionService.addPoll(formValue.description, formValue.options).toPromise();
      if (result.status == 'OK') {
        this.pollStarted = true;
        const pollResult = await this.sessionService.getPollResult(result.data.poll.id).toPromise();
        if (pollResult.status == 'OK') {
          this.activePoll = pollResult.data.poll;
        }
        this.currentState = 'result';
        this.form.reset();
        this.published.emit(this.activePoll.id);
        // this.updatePollTimer = setTimeout(() => {
        //   this.updatePollResult();
        // }, 5000);
        callback();
      }
    } catch (e) {
      console.error(e);
      callback();
    }
  }

  async changePollState(state: string, callback?: any) {
    try {
      const result = await this.sessionService.changePollPublishState(this.activePoll.id, state).toPromise();
      if (result.status == 'OK') {
        if (callback) {
          callback();
        }
        this.pollStarted = false;
        this.currentState = 'modify';
        // clearTimeout(this.updatePollTimer);
        this[state.toLowerCase()].emit();
        this.getArchivePolls();
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
        if (callback) {
          callback();
        }
        this.activePoll = result.data.poll;
      }
    } catch (error) {
      console.error(error);
      if (callback) {
        callback();
      }
    }
  }

  ngOnDestroy() {
    // clearTimeout(this.updatePollTimer);
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
}
