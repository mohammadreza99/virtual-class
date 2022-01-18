import {HttpHeaders} from '@angular/common/http';
import {ContextMenu} from 'primeng/contextmenu';
import {NgButtonAppearance} from './button';
import {NgColor} from './color';
import {
  NgAddonConfig,
  NgColorFormat,
  NgCurrency,
  NgCurrencyDisplay,
  NgDatePickerMode,
  NgErrorType,
  NgFilterMatchMode,
  NgInputFileMode,
  NgKeyFilter,
  NgLabelPosition,
  NgNumberButtonLayout,
  NgNumberMode,
} from './forms';
import {NgOrientation, NgPosition, NgSelectionMode, NgSize} from './offset';
import {NgTreeFilterMode} from './tree';
import {AbstractControl, ValidationErrors} from '@angular/forms';

export interface NgConfirmOptions {
  header?: string;
  message?: string;
  key?: string;
  icon?: string;
  width?: string;
  closable?: boolean;
  acceptLabel?: string;
  acceptVisible?: boolean;
  acceptColor?: NgColor;
  acceptAppearance?: NgButtonAppearance;
  acceptIcon?: string;
  rejectLabel?: string;
  rejectColor?: NgColor;
  rejectAppearance?: NgButtonAppearance;
  rejectIcon?: string;
  rejectVisible?: boolean;
  rtl?: boolean;
  position?: NgPosition;
  blockScroll?: boolean;
  dismissableMask?: boolean;
  defaultFocus?: 'accept' | 'reject' | 'none';
}

export interface NgConfirmPopupOptions extends NgConfirmOptions {
  target: any;
}

export interface NgToastOptions {
  key?: string;
  preventOpenDuplicates?: boolean;
  preventDuplicates?: boolean;
  position?: NgPosition;
  rtl: boolean;
}

export type NgMessageSeverities = 'success' | 'info' | 'warn' | 'error';

export interface NgMessage {
  severity?: NgMessageSeverities;
  summary?: string;
  detail?: string;
  id?: any;
  key?: string;
  life?: number;
  sticky?: boolean;
  closable?: boolean;
  data?: any;
}

export interface NgMessageOptions {
  escape?: boolean;
  closable?: boolean;
  rtl?: boolean;
}


export interface NgDialog {
  header?: string;
  message?: string;
  draggable?: boolean;
  keepInViewport?: boolean;
  resizable?: boolean;
  contentStyle?: object;
  modal?: boolean;
  position?: string;
  blockScroll?: boolean;
  closeOnEscape?: boolean;
  dismissableMask?: boolean;
  rtl?: boolean;
  closable?: boolean;
  appendTo?: any;
  style?: object;
  styleClass?: string;
  maskStyleClass?: string;
  contentStyleClass?: string;
  showHeader?: boolean;
  baseZIndex?: number;
  autoZIndex?: boolean;
  minX?: number;
  minY?: number;
  focusOnShow?: boolean;
  focusTrap?: boolean;
  maximizable?: boolean;
  transitionOptions?: string;
  closeIcon?: string;
  minimizeIcon?: string;
  maximizeIcon?: string;
  buttonLabel?: string;
  buttonIcon?: string;
  buttonAppearance?: NgButtonAppearance;
  buttonIconPos?: NgPosition;
  buttonRounded?: boolean;
  buttonRaised?: boolean;
  buttonColor?: NgColor;
  buttonFull?: boolean;
  buttonSize?: NgSize;
}

export type NgDialogFormError = {
  type: NgErrorType;
  message: string;
  value?: any;
};

export interface NgDialogFormOptions {
  footer?: string;
  width?: string;
  height?: string;
  closeOnEscape?: boolean;
  dismissableMask?: boolean;
  closable?: boolean;
  showHeader?: boolean;
  rtl?: boolean;
  acceptVisible?: boolean;
  acceptIcon?: string;
  acceptColor?: NgColor;
  acceptLabel?: string;
  acceptAppearance?: NgButtonAppearance;
  rejectVisible?: boolean;
  rejectIcon?: string;
  rejectColor?: NgColor;
  rejectLabel?: string;
  rejectAppearance?: NgButtonAppearance;
  formValidator?: {
    validatorFn: (group: AbstractControl) => ValidationErrors | null,
    error: string,
    message: string,
  };
}

export type NgDialogFormRuleAction =
  | 'visible'
  | 'invisible'
  | 'disable'
  | 'enable';

export interface NgDialogFormRule {
  tobe: any[];
  control: string;
  action: NgDialogFormRuleAction;
}

export type NgDialogFormInputTypes =
  | 'hidden'
  | 'row'
  | 'template'
  | 'autocomplete'
  | 'cascade-select'
  | 'chips'
  | 'color-picker'
  | 'date-picker'
  | 'dropdown'
  | 'dropdown-tree'
  | 'editor'
  | 'file-picker'
  | 'file-picker2'
  | 'text'
  | 'mask'
  | 'number'
  | 'password'
  | 'textarea'
  | 'list-box'
  | 'multi-checkbox'
  | 'multi-select'
  | 'radio'
  | 'rating'
  | 'select-button'
  | 'single-checkbox'
  | 'slider'
  | 'switch'
  | 'toggle-button'
  | 'tree';

export interface NgDialogFormConfig {
  type: NgDialogFormInputTypes;
  formControlName?: string;
  className?: string | string[];
  visible?: boolean;
  value?: any;
  suggestions?: any[];
  dropdown?: boolean;
  minlength?: number;
  completeOnFocus?: boolean;
  autoHighlight?: boolean;
  immutable?: boolean;
  forceSelection?: boolean;
  dropdownMode?: 'blank' | 'current';
  unique?: boolean;
  field?: string;
  allowDuplicate?: boolean;
  addOnTab?: boolean;
  addOnBlur?: boolean;
  locale?: string;
  datePickerMode?: NgDatePickerMode;
  inline?: boolean;
  clearable?: boolean;
  optionGroupLabel?: string;
  optionGroupChildren?;
  editable?: boolean;
  autofocus?: boolean;
  autoDisplayFirst?: boolean;
  group?: boolean;
  showClear?: boolean;
  name?: string;
  url?: string;
  withCredentials?: boolean;
  customUpload?: boolean;
  auto?: boolean;
  accept?: string;
  method?: string;
  maxFileSize?: number;
  previewWidth?: number;
  fileLimit?: number;
  resultType?: 'base64' | 'file';
  chooseLabel?: string;
  uploadLabel?: string;
  cancelLabel?: string;
  headers?: HttpHeaders;
  showUploadButton?: boolean;
  showCancelButton?: boolean;
  invalidFileSizeMessageSummary?: string;
  invalidFileSizeMessageDetail?: string;
  invalidFileTypeMessageSummary?: string;
  invalidFileLimitMessageDetail?: string;
  invalidFileLimitMessageSummary?: string;
  invalidFileTypeMessageDetail?: string;
  mask?: string;
  slotChar?: string;
  autoClear?: boolean;
  unmask?: boolean;
  characterPattern?: string;
  autoFocus?: boolean;
  autocomplete?: string;
  format?: NgColorFormat | boolean;
  showButtons?: boolean;
  buttonLayout?: NgNumberButtonLayout;
  incrementButtonIcon?: string;
  decrementButtonIcon?: string;
  mode?: NgInputFileMode | NgNumberMode;
  prefix?: string;
  suffix?: string;
  currency?: NgCurrency;
  currencyDisplay?: NgCurrencyDisplay;
  useGrouping?: boolean;
  minFractionDigits?: number;
  maxFractionDigits?: number;
  title?: string;
  promptLabel?: string;
  weakLabel?: string;
  mediumLabel?: string;
  strongLabel?: string;
  feedback?: boolean;
  showPassword?: boolean;
  rows?: number;
  cols?: number;
  autoResize?: boolean;
  maxlength?: number;
  checkbox?: boolean;
  filled?: boolean;
  icon?: string;
  inputSize?: NgSize;
  appendTo?: string;
  autofocusFilter?;
  defaultLabel?: string;
  displaySelectedLabel?;
  emptyFilterMessage?: string;
  filterMatchMode?: NgFilterMatchMode;
  filterValue?: string;
  filterPlaceHolder?: string;
  maxSelectedLabels?;
  overlayVisible?: boolean;
  placeholder?: string;
  resetFilterOnHide?: boolean;
  selectedItemsLabel?: string;
  selectionLimit?: number;
  showHeader?: boolean;
  showToggleAll?: boolean;
  tooltip?: string;
  tooltipPosition?;
  stars?: number;
  cancel?: boolean;
  iconOnClass?: string;
  iconOffClass?: string;
  iconCancelClass?: string;
  addon?: NgAddonConfig;
  options?: any[];
  optionLabel?: string;
  optionValue?: string;
  optionDisabled?: string;
  multiple?: boolean;
  dataKey?: string;
  binary?: boolean;
  animate?: boolean;
  min?: number;
  max?: number;
  orientation?: NgOrientation;
  step?: number;
  range?: boolean;
  onLabel?: string;
  offLabel?: string;
  onIcon?: string;
  offIcon?: string;
  iconPos?: NgPosition;
  disabled?: boolean;
  readonly?: boolean;
  selection?: any;
  label?: string;
  labelWidth?: number | string;
  hint?: string;
  rtl?: boolean;
  showRequiredStar?: boolean;
  labelPos?: NgLabelPosition;
  errors?: NgDialogFormError[];
  items?: any[];
  selectionMode?: NgSelectionMode;
  contextMenu?: ContextMenu;
  layout?: NgOrientation;
  draggableScope?: string;
  droppableScope?: string;
  draggableNodes?: string;
  droppableNodes?: string;
  metaKeySelection?: boolean;
  propagateSelectionUp?: boolean;
  propagateSelectionDown?: boolean;
  loading?: boolean;
  validateDrop?;
  emptyMessage?: string;
  filter?: boolean;
  filterBy?: string;
  filterMode?: NgTreeFilterMode;
  filterPlaceholder?: string;
  filterLocale?: string;
  scrollHeight?: string;
  virtualScroll?: boolean;
  virtualNodeHeight?: number;
  minBufferPx?: number;
  maxBufferPx?: number;
  trackBy?: Function;
  indentation?: number;
  size?: NgSize | number;
  keyFilter?: NgKeyFilter | RegExp;
  style?: any;
  template?: string;
  showImagePreview?: boolean;
  color?: NgColor;
  rules?: NgDialogFormRule[];
}
