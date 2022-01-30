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
import {NgAddonConfig, NgError, NgInputTypes, NgKeyFilter, NgLabelPosition} from '@ng/models/forms';
import {NgPosition, NgSize} from '@ng/models/offset';

@Component({
  selector: 'ng-input-text',
  templateUrl: './input-text.component.html',
  styleUrls: ['./input-text.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputTextComponent),
      multi: true
    }
  ]
})
export class InputTextComponent implements OnInit, ControlValueAccessor {
  @Input() value: any;
  @Input() label: string;
  @Input() filled: boolean = false;
  @Input() labelWidth: number;
  @Input() hint: string;
  @Input() rtl: boolean = false;
  @Input() showRequiredStar: boolean = true;
  @Input() labelPos: NgLabelPosition = 'float';
  @Input() iconPos: NgPosition = 'left';
  @Input() errors: NgError;
  @Input() addon: {
    before?: NgAddonConfig;
    after?: NgAddonConfig;
  };
  @Input() icon: string;
  @Input() inputSize: NgSize = 'md';
  @Input() readonly: boolean = false;
  @Input() disabled: boolean = false;
  @Input() maxlength: number;
  @Input() placeholder: string;
  @Input() type: NgInputTypes = 'text';
  @Input() keyFilter: NgKeyFilter | RegExp;
  @Output() onInput = new EventEmitter();
  @Output() onClick = new EventEmitter();
  @Output() onChange = new EventEmitter();
  @Output() onKeydown = new EventEmitter();
  @Output() onKeyup = new EventEmitter();
  @Output() onBlur = new EventEmitter();
  @Output() onFocus = new EventEmitter();
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
    if (!this.keyFilter) {
      this.keyFilter = /.*/g;
    }
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

  _onChange(event: Event) {
    /* onchange occurs when the selection, the checked state or the contents of an element have changed. In some cases, it only occurs when the element loses the focus. The onchange attribute can be used with <input>, <select>, and <textarea> */
    const inputElement = event.target as HTMLInputElement;
    this.onChange.emit(event);
    this.onModelChange(inputElement.value);
  }

  _onInput(event: InputEvent) {
    /* oninput event occurs when the text content of an element is changed through the user interface */
    const inputElement = event.target as HTMLInputElement;
    this.onInput.emit(event);
    this.onModelChange(inputElement.value);
  }

  _onBlur() {
    this.onBlur.emit();
    this.onModelTouched();
  }

  emitter(name: string, event: any) {
    (this[name] as EventEmitter<any>).emit(event);
  }

  _onKeydown(event: KeyboardEvent) {
    const inputElement = event.target as HTMLInputElement;
    this.onKeydown.emit(event);
    this.onModelChange(inputElement.value);
  }

  _onKeyup(event: KeyboardEvent) {
    const inputElement = event.target as HTMLInputElement;
    this.onKeyup.emit(event);
    this.onModelChange(inputElement.value);
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
