import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  InjectFlags,
  Injector,
  Input,
  OnInit,
  Output,
  ViewChild,
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
import {NgAddonConfig, NgError, NgLabelPosition} from '@ng/models/forms';
import {NgPosition, NgSelectionMode, NgSize} from '@ng/models/offset';
import {NgTreeFilterMode} from '@ng/models/tree';
import {TreeNode} from 'primeng/api';

@Component({
  selector: 'ng-dropdown-tree',
  templateUrl: './dropdown-tree.component.html',
  styleUrls: ['./dropdown-tree.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DropdownTreeComponent),
      multi: true,
    },
  ],
})
export class DropdownTreeComponent implements OnInit, ControlValueAccessor {
  @Input() items: TreeNode[];
  @Input() selection: any;
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
  @Input() inputSize: NgSize = 'md';
  @Input() disabled: boolean = false;
  @Input() placeholder: string;
  @Input() emptyMessage: string = 'موردی وجود ندارد';
  @Input() selectionMode: NgSelectionMode = 'checkbox';
  @Input() filter: boolean = true;
  @Input() filterBy: string = 'label';
  @Input() filterMode: NgTreeFilterMode = 'lenient';
  @Input() filterPlaceholder: string;
  @Input() filterLocale: string;
  @Output() selectionChange = new EventEmitter();
  @Output() onNodeSelect = new EventEmitter();
  @Output() onNodeUnselect = new EventEmitter();
  @Output() onNodeExpand = new EventEmitter();
  @Output() onNodeCollapse = new EventEmitter();
  @Output() onBeforeBtnClick = new EventEmitter();
  @Output() onAfterBtnClick = new EventEmitter();
  @ViewChild('inputEl', {static: true, read: ElementRef})
  inputEl: ElementRef;
  @ViewChild('ddEl', {static: true, read: ElementRef})
  dropDownEl: ElementRef;

  visible: boolean = false;
  inputValue: string;
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
    if (this.selection) {
      this.getInputValue();
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
        currentControl.markAsTouched();
      });
    }
  }

  _onSelectionChange(event) {
    this.selection = event;
    this.selectionChange.emit(this.selection);
  }

  _onNodeSelect(event) {
    this.getInputValue();
    this.onModelChange(this.selection);
    this.onNodeSelect.emit(event);
  }

  _onNodeUnselect(event) {
    this.getInputValue();
    this.onModelChange(this.selection);
    this.onNodeUnselect.emit(event);
  }

  emitter(name: string, event: any) {
    (this[name] as EventEmitter<any>).emit(event);
  }

  onClick() {
    this.visible = !this.visible;
    this.setPosition();
  }

  setPosition() {
    const inputEl = this.inputEl.nativeElement;
    const dropDownEl = this.dropDownEl.nativeElement;
    dropDownEl.style.top = inputEl.offsetHeight + 'px';
  }

  getInputValue() {
    switch (this.selectionMode) {
      case 'single':
        this.closeDropdown();
        this.inputValue = this.selection.label;
        break;
      case 'checkbox':
      case 'multiple':
        let result = '';
        const selection = this.selection as TreeNode[];
        for (let i = 0; i < selection.length; i++) {
          result +=
            selection[i].label + (i !== selection.length - 1 ? ' ، ' : '');
        }
        this.inputValue = result;
        break;
    }
  }

  closeDropdown() {
    this.visible = false;
  }

  onOutsideClick() {
    this.closeDropdown();
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
    this.selection = value;
    this.getInputValue();
    this.cd.markForCheck();
  }

  registerOnChange(fn) {
    this.onModelChange = fn;
  }

  registerOnTouched(fn) {
    this.onModelTouched = fn;
  }
}
