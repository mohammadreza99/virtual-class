import {Component, Input, OnInit, Optional, ViewChild} from '@angular/core';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';
import {DynamicDialogConfig} from 'primeng/dynamicdialog';
import {PollItem, QuestionItem} from '@core/models';
import {OverlayPanel} from 'primeng/overlaypanel';

@Component({
  selector: 'ng-result-table',
  templateUrl: './result-table.component.html',
  styleUrls: ['./result-table.component.scss']
})
export class ResultTableComponent extends LanguageChecker implements OnInit {
  @ViewChild(OverlayPanel) overlay: OverlayPanel;

  constructor(@Optional() public dialogConfig: DynamicDialogConfig) {
    super();
  }

  @Input() item: PollItem | QuestionItem;
  @Input() darkText: boolean = false;
  @Input() clickableRows: boolean = true;
  replies: any[] = [];
  searchTerm: string;

  ngOnInit(): void {
    if (this.dialogConfig) {
      this.item = this.dialogConfig.data;
      // when dialogConfig is not NULL, means that student is visiting the modal and should not click on rows.
      this.darkText = true;
      this.clickableRows = false;
    }
  }

  async showDetails(event: any, option: any) {
    if (!this.clickableRows) {
      return;
    }
    this.replies = option.replies;
    if (this.replies.length == 0) {
      return;
    }
    setTimeout(() => {
      this.overlay.toggle(event);
    }, 300);
  }
}
