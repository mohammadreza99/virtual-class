import {Component, OnInit} from '@angular/core';
import {DynamicDialogConfig, DynamicDialogRef} from 'primeng/dynamicdialog';
import {GroupRelation, UserRelation} from '@core/models';

@Component({
  selector: 'ng-group-relations',
  templateUrl: './group-relations.component.html',
  styleUrls: ['./group-relations.component.scss']
})
export class GroupRelationsComponent implements OnInit {
  constructor(private dialogConfig: DynamicDialogConfig,
              private dialogRef: DynamicDialogRef) {
  }

  relations: GroupRelation;

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
