import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  forwardRef,
  InjectFlags,
  Injector,
  Input,
  OnInit,
  Output
} from '@angular/core';
import {
  AbstractControl,
  ControlContainer,
  ControlValueAccessor,
  FormControl,
  FormControlName,
  FormGroup,
  FormGroupDirective,
  NG_VALUE_ACCESSOR,
  NgControl,
  NgModel
} from '@angular/forms';
import { NgError } from '@ng/models/forms';

@Component({
  selector: 'ng-single-checkbox',
  templateUrl: './single-checkbox.component.html',
  styleUrls: ['./single-checkbox.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SingleCheckboxComponent),
      multi: true
    }
  ]
})
export class SingleCheckboxComponent implements OnInit, ControlValueAccessor {
  @Input() value: any;
  @Input() label: string;
  @Input() hint: string;
  @Input() rtl: boolean = false;
  @Input() showRequiredStar: boolean = true;
  @Input() errors: NgError;
  @Input() disabled: boolean = false;
  @Input() readonly: boolean = false;
  @Output() onChange = new EventEmitter();

  inputId: string;
  controlContainer: FormGroupDirective;
  ngControl: NgControl;

  constructor(private cd: ChangeDetectorRef, private injector: Injector) {
  }

  onModelChange: any = (_: any) => {
  };

  onModelTouched: any = () => {
  };

  ngOnInit() {
    let parentForm: FormGroup;
    let rootForm: FormGroupDirective;
    let currentControl: AbstractControl;
    this.inputId = this.getId();
    this.controlContainer = this.injector.get(
      ControlContainer,
      null,
      InjectFlags.Optional || InjectFlags.Host || InjectFlags.SkipSelf
    ) as FormGroupDirective;
    this.ngControl = this.injector.get(NgControl, null);
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
    if (this.controlContainer && this.ngControl) {
      parentForm = this.controlContainer.control;
      rootForm = this.controlContainer.formDirective as FormGroupDirective;
      if (this.ngControl instanceof NgModel) {
        currentControl = this.ngControl.control;
      }
      else if (this.ngControl instanceof FormControlName) {
        currentControl = parentForm.get(this.ngControl.name.toString());
      }
      rootForm.ngSubmit.subscribe(() => {
        if (!this.disabled) {
          currentControl.markAsTouched();
        }
      });
      if (this.showRequiredStar) {
        if (this.isRequired(currentControl)) {
          if (this.label) {
            this.label += ' *';
          }
        }
      }
    }
  }

  _onChange(event) {
    let parentForm: FormGroup;
    let currentControl: AbstractControl;
    if (this.controlContainer && this.ngControl) {
      parentForm = this.controlContainer.control;
      if (this.ngControl instanceof NgModel) {
        currentControl = this.ngControl.control;
      }
      else if (this.ngControl instanceof FormControlName) {
        currentControl = parentForm.get(this.ngControl.name.toString());
      }
      if (this.isRequired(currentControl)) {
        this.onModelChange(event.checked ? true : null);
      }
      else {
        this.onModelChange(event.checked);
      }
    }
    else {
      this.onModelChange(event.checked);
    }
    this.onChange.emit(event);
    this.value = event.checked;
  }

  getId() {
    return Math.random().toString(36).substr(2, 9);
  }

  isInvalid(formControl: AbstractControl) {
    return (
      (formControl.invalid && formControl.touched) ||
      (formControl.invalid && formControl.dirty)
    );
  }

  showError(errorType: string): boolean {
    return (
      this.isInvalid(this.ngControl.control) &&
      this.ngControl.control.hasError(errorType.toLowerCase())
    );
  }

  isRequired(control: AbstractControl): boolean {
    let isRequired = false;
    const formControl = new FormControl();
    for (const key in control) {
      if (Object.prototype.hasOwnProperty.call(control, key)) {
        formControl[key] = control[key];
      }
    }
    formControl.setValue(null);
    if (formControl.errors?.required) {
      isRequired = true;
    }
    formControl.setValue(control.value);
    return isRequired;
  }

  writeValue(value: any) {
    this.value = value;
    this.cd.markForCheck();
  }

  registerOnChange(fn) {
    this.onModelChange = fn;
  }

  registerOnTouched(fn) {
    this.onModelTouched = fn;
  }

  setDisabledState(val: boolean) {
    this.disabled = val;
    this.cd.markForCheck();
  }
}
