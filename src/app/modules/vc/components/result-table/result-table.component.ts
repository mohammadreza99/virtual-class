import {Component, Input, OnInit, Optional} from '@angular/core';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {DynamicDialogConfig} from 'primeng/dynamicdialog';
import {PollItem, QuestionItem} from '@core/models';
import {OverlayPanel} from 'primeng/overlaypanel';
import {SessionService} from '@core/http';

@Component({
  selector: 'ng-result-table',
  templateUrl: './result-table.component.html',
  styleUrls: ['./result-table.component.scss']
})
export class ResultTableComponent extends LanguageChecker implements OnInit {

  constructor(@Optional() public dialogConfig: DynamicDialogConfig, private sessionService: SessionService) {
    super();
  }

  @Input() item: PollItem | QuestionItem;
  @Input() type: 'poll' | 'question' = 'poll';
  clickableRows: boolean = true;
  replies: any[] = [];

  ngOnInit(): void {
    if (this.dialogConfig) {
      this.item = this.dialogConfig.data;
      // when dialogConfig is not NULL, means that student is visiting the modal and should not click on rows.
      this.clickableRows = false;
    }
  }

  async showDetails(event: any, option: any, overlay: OverlayPanel) {
    if (!this.clickableRows) {
      return;
    }
    let result;
    if (this.type == 'poll') {
      result = await this.sessionService.getPollOptionReplies(option.id).toPromise();
    } else if (this.type == 'question') {
      result = await this.sessionService.getQuestionOptionReplies(option.id).toPromise();
    }
    if (result.status == 'OK') {
      this.replies = result.data.replies;
    }
    if (this.replies.length == 0) {
      return;
    }
    setTimeout(() => {
      overlay.show(event);
    }, 50);
  }

  getColor(user: any) {
    return this.sessionService.getProfileColor(user.user_id);
  }
}
