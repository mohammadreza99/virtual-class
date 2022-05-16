import {Component, Input, OnInit, Output, EventEmitter, OnChanges, SimpleChanges} from '@angular/core';
import {NgButtonAppearance, NgButtonType} from '@ng/models/button';
import {NgPosition, NgSize} from '@ng/models/offset';
import {NgColor} from '@ng/models/color';

@Component({
  selector: 'ng-button-async',
  templateUrl: './button-async.component.html',
  styleUrls: ['./button-async.component.scss'],
  host: {'[class.w-100]': 'full'}
})
export class ButtonAsyncComponent implements OnInit, OnChanges {

  @Input() label: string;
  @Input() disabled: boolean = false;
  @Input() iconPos: NgPosition = 'left';
  @Input() type: NgButtonType = 'button';
  @Input() rounded: boolean = false;
  @Input() raised: boolean = false;
  @Input() icon: string;
  @Input() appearance: NgButtonAppearance;
  @Input() color: NgColor = 'primary';
  @Input() full: boolean = false;
  @Input() badge: string | number;
  @Input() badgeColor: NgColor = 'primary';
  @Input() size: NgSize = 'md';
  @Input() newLabel: string;
  @Input() newIcon: string;
  @Input() newAppearance: NgButtonAppearance;
  @Input() newColor: NgColor = 'primary';
  @Input() defaultState: 1 | 2 = 1;
  @Output() defaultStateChange = new EventEmitter();
  @Output() clickAsync = new EventEmitter();

  loading: boolean = false;
  _tmpLabel: string;
  _tmpIcon: string;
  _tmpAppearance: NgButtonAppearance;
  _tmpColor: NgColor;

  constructor() {
  }

  ngOnChanges(changes: SimpleChanges) {
    this.toggleState(this.defaultState);
  }

  ngOnInit(): void {
    this.toggleState(this.defaultState);
  }

  onClick() {
    this.loading = true;
    this.defaultState = this.defaultState === 1 ? 2 : 1;
    this.defaultStateChange.emit(this.defaultState);
    this.clickAsync.emit(this.removeLoading);
  }

  removeLoading = (toggleState: boolean = true) => {
    this.loading = false;
    if (toggleState) {
      this.toggleState(this.defaultState);
    }
  };

  toggleState(defaultState: 1 | 2) {
    if (!this.disabled) {
      this._tmpLabel = defaultState === 1 ? this.label : this.newLabel || this.label;
      this._tmpIcon = defaultState === 1 ? this.icon : this.newIcon || this.icon;
      this._tmpAppearance = defaultState === 1 ? this.appearance : this.newAppearance || this.appearance;
      this._tmpColor = defaultState === 1 ? this.color : this.newColor || this.color;
    } else {
      this.defaultState = 1;
      this._tmpLabel = this.label;
      this._tmpIcon = this.icon;
      this._tmpAppearance = this.appearance;
      this._tmpColor = this.color;
    }
  }
}
