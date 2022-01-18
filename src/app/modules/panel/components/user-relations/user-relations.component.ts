import {Component, OnInit} from '@angular/core';
import {DynamicDialogConfig, DynamicDialogRef} from 'primeng/dynamicdialog';
import {UserRelation} from '@core/models';

@Component({
  selector: 'ng-user-relations',
  templateUrl: './user-relations.component.html',
  styleUrls: ['./user-relations.component.scss']
})
export class UserRelationsComponent implements OnInit {

  constructor(public dialogConfig: DynamicDialogConfig,
              private dialogRef: DynamicDialogRef) {
  }

  relations: UserRelation;

  ngOnInit(): void {
    this.relations = this.dialogConfig.data;
  }

  onClose() {
    this.dialogRef.close(false);
  }

  onSubmit() {
    this.dialogRef.close(true);
  }
}
