import {ChangeDetectorRef, Component, EventEmitter, InjectFlags, Injector, Input, OnInit, Output} from '@angular/core';
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
  NgModel,
} from '@angular/forms';
import {NgAddonConfig, NgError, NgLabelPosition} from '@ng/models/forms';
import {NgPosition, NgSize} from '@ng/models/offset';

@Component({
  selector: 'ng-auto-complete',
  templateUrl: './auto-complete.component.html',
  styleUrls: ['./auto-complete.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: AutoCompleteComponent,
      multi: true,
    },
  ],
})
export class AutoCompleteComponent implements OnInit, ControlValueAccessor {
  @Input() value: any;
  @Input() label: string;
  @Input() filled: boolean = false;
  @Input() labelWidth: number;
  @Input() hint: string;
  @Input() rtl: boolean = false;
  @Input() showRequiredStar: boolean = true;
  @Input() labelPos: NgLabelPosition = 'float';
  @Input() iconPos: NgPosition = 'left';
  @Input() addon: {
    before?: NgAddonConfig;
    after?: NgAddonConfig;
  };
  @Input() errors: NgError;
  @Input() suggestions: any[];
  @Input() field: any;
  @Input() scrollHeight: string = '200px';
  @Input() dropdown: boolean = false;
  @Input() multiple: boolean = false;
  @Input() minlength: number = 1;
  @Input() completeOnFocus: boolean = false;
  @Input() placeholder: string;
  @Input() readonly: boolean = false;
  @Input() disabled: boolean = false;
  @Input() maxlength: number;
  @Input() size: number;
  @Input() icon: string;
  @Input() inputSize: NgSize = 'md';
  @Input() appendTo: any;
  @Input() dataKey: string;
  @Input() autoHighlight: boolean = false;
  @Input() emptyMessage: string;
  @Input() immutable: boolean = true;
  @Input() autofocus: boolean = false;
  @Input() forceSelection: boolean = true;
  @Input() dropdownMode: 'blank' | 'current' = 'blank';
  @Input() unique: boolean = true;
  @Output() completeMethod = new EventEmitter();
  @Output() onFocus = new EventEmitter();
  @Output() onBlur = new EventEmitter();
  @Output() onKeyUp = new EventEmitter();
  @Output() onSelect = new EventEmitter();
  @Output() onUnselect = new EventEmitter();
  @Output() onDropdownClick = new EventEmitter();
  @Output() onClear = new EventEmitter();
  @Output() onShow = new EventEmitter();
  @Output() onHide = new EventEmitter();
  @Output() onBeforeBtnClick = new EventEmitter();
  @Output() onAfterBtnClick = new EventEmitter();

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
      } else if (this.ngControl instanceof FormControlName) {
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
          if (this.placeholder) {
            this.placeholder += ' *';
          }
        }
      }
    }
  }

  _completeMethod(event) {
    this.completeMethod.emit(event);
  }

  _onBlur() {
    this.onBlur.emit();
    this.onModelTouched();
  }

  _onKeyUp(event: KeyboardEvent) {
    const inputElement = event.target as HTMLInputElement;
    this.onKeyUp.emit(event);
    if (!this.forceSelection) {
      this.onModelChange(inputElement.value);
    }
  }

  _onSelect(event) {
    this.onSelect.emit(event);
    this.onModelChange(this.value);
  }

  _onUnselect(event) {
    this.onUnselect.emit(event);
    this.onModelChange(this.value);
  }

  _onDropdownClick(event) {
    this.onDropdownClick.emit(event);
  }

  _onClear(event: InputEvent) {
    const inputElement = event.target as HTMLInputElement;
    this.onClear.emit(event);
    this.onModelChange(inputElement.value);
  }

  emitter(name: string, event: any) {
    (this[name] as EventEmitter<any>).emit(event);
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

