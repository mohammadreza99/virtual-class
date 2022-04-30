import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  ContentChildren,
  QueryList,
  TemplateRef,
  AfterContentInit
} from '@angular/core';
import {NgPosition, NgSize} from '@ng/models/offset';
import {NgColor} from '@ng/models/color';
import {NgButtonAppearance, NgButtonType} from '@ng/models/button';
import {TemplateDirective} from '@ng/directives/template.directive';

@Component({
  selector: 'ng-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
  host: {'[class.full]': 'full'}
})
export class ButtonComponent implements OnInit, AfterContentInit {
  @Input() label: string;
  @Input() icon: string;
  @Input() appearance: NgButtonAppearance;
  @Input() disabled: boolean = false;
  @Input() iconPos: NgPosition = 'left';
  @Input() type: NgButtonType = 'button';
  @Input() rounded: boolean = false;
  @Input() raised: boolean = false;
  @Input() color: NgColor = 'primary';
  @Input() full: boolean = false;
  @Input() badge: string | number;
  @Input() badgeColor: NgColor = 'primary';
  @Input() size: NgSize = 'md';
  @Input() loading: boolean = false;
  @Output() onClick = new EventEmitter();
  @ContentChildren(TemplateDirective) templates: QueryList<TemplateDirective>;
  contentTemplate: TemplateRef<any>;

  constructor() {
  }

  ngOnInit(): void {
  }


  ngAfterContentInit() {
    this.templates.forEach((item: TemplateDirective) => {
      switch (item.getType()) {
        case 'content':
          this.contentTemplate = item.templateRef;
          break;

        default:
          this.contentTemplate = item.templateRef;
          break;
      }
    });
  }

  _onClick(event: any) {
    this.onClick.emit(event);
  }
}
