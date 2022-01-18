import {Component, Input, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';

@Component({
  selector: 'ng-dynamic-form',
  templateUrl: './dynamic-form.component.html',
  styleUrls: ['./dynamic-form.component.scss']
})
export class DynamicFormComponent implements OnInit {


  @Input() config: any[];
  form: FormGroup = new FormGroup({});

  constructor() {
  }

  ngOnInit(): void {
    for (const configElement of this.config) {
      this.form.addControl(configElement.formControlName, new FormControl('', [Validators.required]));
    }
  }

  onSubmit() {
  }

}
