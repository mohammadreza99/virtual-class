import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  forwardRef,
  InjectFlags,
  Injector,
  Input,
  OnChanges,
  OnInit,
  Output,
  ViewEncapsulation,
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
  NgModel,
} from '@angular/forms';
import {NgAddonConfig, NgDatePickerMode, NgError, NgLabelPosition} from '@ng/models/forms';
import {NgPosition, NgSize} from '@ng/models/offset';
import {UtilsService} from '@ng/services';
import * as moment from 'jalali-moment';
import {ECalendarValue, IDatePickerConfig} from 'ng2-jalali-date-picker';

@Component({
  selector: 'ng-date-picker',
  templateUrl: './date-picker.component.html',
  styleUrls: ['./date-picker.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true,
    },
  ],
})
export class DatePickerComponent
  implements OnInit, ControlValueAccessor, OnChanges {
  @Input() value: any;
  @Input() label: string;
  @Input() filled: boolean = false;
  @Input() labelWidth: number;
  @Input() hint: string;
  @Input() rtl: boolean = false;
  @Input() showRequiredStar: boolean = true;
  @Input() labelPos: NgLabelPosition = 'float';
  @Input() iconPos: NgPosition = 'left';
  @Input() locale: string = 'fa';
  @Input() errors: NgError;
  @Input() appendTo: string = 'body';
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
  @Input() datePickerMode: NgDatePickerMode = 'day';
  @Input() inline: boolean = false;
  @Input() clearable: boolean = false;
  @Output() onChange = new EventEmitter();
  @Output() onBlur = new EventEmitter();
  @Output() onFocus = new EventEmitter();
  @Output() onOpen = new EventEmitter();
  @Output() onClose = new EventEmitter();
  @Output() onGoToCurrent = new EventEmitter();
  @Output() onLeftNav = new EventEmitter();
  @Output() onRightNav = new EventEmitter();
  @Output() onSelect = new EventEmitter();
  @Output() onMonthSelect = new EventEmitter();
  @Output() onNavHeaderBtnClick = new EventEmitter();
  @Output() onBeforeBtnClick = new EventEmitter();
  @Output() onAfterBtnClick = new EventEmitter();

  config: IDatePickerConfig = {
    disableKeypress: true,
    closeOnSelect: true,
    openOnClick: !this.readonly,
    openOnFocus: !this.readonly,
    allowMultiSelect: false,
    showTwentyFourHours: true,
    showGoToCurrent: true,
    locale: moment.locale(this.locale),
    closeOnSelectDelay: 100,
    appendTo: this.appendTo,
    showSeconds: true,
    returnedValueType: ECalendarValue.Moment,
  };
  inputId: string;
  controlContainer: FormGroupDirective;
  ngControl: NgControl;
  _miladiMonths = [
    'ژانویه ',
    'فوریه ',
    'مارس',
    'آوریل',
    'می',
    'ژوئن',
    'جولای',
    'آگوست',
    'سپتامبر',
    'اکتبر',
    'نوامبر',
    'دسامبر',
  ];
  _months = [
    'فروردین',
    'اردیبهشت',
    'خرداد',
    'تیر',
    'مرداد',
    'شهریور',
    'مهر',
    'آبان',
    'آذر',
    'دی',
    'بهمن',
    'اسفند',
  ];
  _weeks: string[] = [
    'شنبه',
    'یکشنبه',
    'دوشنبه',
    'سه شنبه',
    'چهارشنبه',
    'پنج شنبه',
    'جمعه',
  ];

  constructor(
    private cd: ChangeDetectorRef,
    private injector: Injector,
  ) {
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
    if (this.clearable && !this.addon) {
      this.icon = 'pi pi-times';
      this.iconPos = this.rtl ? 'left' : 'right';
    }
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

  ngOnChanges() {
    this.config.locale = moment.locale(this.locale);
  }

  _onChange(event) {
    if (event) {
      let result;
      const moment = (this.inline ? event.date : event) as moment.Moment;
      const date = (this.inline ? event.date._d : event._d) as Date;
      switch (this.datePickerMode) {
        case 'daytime':
        case 'day': {
          result = {
            strWeekDay: this.getStrWeekDay(date),
            strMonth: this._months[moment.month()],
            miladiStrMonth: this._miladiMonths[date.getMonth()],
            dateObj: date,
            momentObj: moment,
          };
          break;
        }
        case 'month': {
          result = {
            strMonth: this._months[moment.month()],
            miladiStrMonth: this._miladiMonths[date.getMonth()],
            momentObj: moment,
            dateObj: date,
          };
          break;
        }
        case 'time': {
          result = {
            momentObj: moment,
            dateObj: date,
          };
          break;
        }
      }
      this.onChange.emit(result);
      this.onModelChange(date);
    }
  }

  _onBlur() {
    this.onBlur.emit();
    this.onModelTouched();
  }

  emitter(name: string, event: any) {
    (this[name] as EventEmitter<any>).emit(event);
  }

  getStrWeekDay(momentObj: Date): string {
    let strWeekDay: string;
    if (momentObj.getDay() === 6) {
      strWeekDay = this._weeks[0];
    } else {
      strWeekDay = this._weeks[momentObj.getDay() + 1];
    }
    return strWeekDay;
  }

  onClearClick() {
    this.value = undefined;
    this.onModelChange(null);
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
