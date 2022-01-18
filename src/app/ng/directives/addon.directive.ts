import { Directive, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, Renderer2 } from '@angular/core';
import { NgAddonConfig } from '@ng/models/forms';

@Directive({
  selector: '[ngAddon]'
})
export class AddonDirective implements OnChanges {
  @Input() ngAddon: {
    before?: NgAddonConfig;
    after?: NgAddonConfig;
  };
  @Output() onBeforeBtnClick = new EventEmitter();
  @Output() onAfterBtnClick = new EventEmitter();

  constructor(private renderer: Renderer2, private el: ElementRef) {
  }

  ngOnChanges(): void {
    if (this.ngAddon) {
      for (const side in this.ngAddon) {
        const config = this.ngAddon[side] as NgAddonConfig;
        switch (config.type) {
          case 'button':
            this.applyButton(config, side);
            break;
          case 'icon':
            this.applyIcon(config, side);
            break;
          case 'text':
            this.applyText(config, side);
            break;
        }
      }
    }
  }

  applyButton(config: any, side: string) {
    const BTN = this.renderer.createElement('button') as HTMLButtonElement;
    const BTN_ICON_SPAN = this.renderer.createElement('span') as HTMLSpanElement;
    const BTN_TEXT_SPAN = this.renderer.createElement('span') as HTMLSpanElement;
    const BTN_TEXT = this.renderer.createText(config.label) as HTMLElement;
    const _btnColor = config.color;
    const _btnIcon = config.icon || null;
    const _btnLabel = config.label || null;
    const _btnIconPos = config.iconPos || 'left';
    this.renderer.setAttribute(BTN, 'type', 'button');
    this.renderer.addClass(BTN, 'p-button');
    this.renderer.addClass(BTN, 'p-component');
    this.renderer.addClass(BTN, `p-button-${_btnColor}`);
    this.renderer.addClass(BTN_TEXT_SPAN, 'p-button-label');
    this.renderer.appendChild(BTN_TEXT_SPAN, BTN_TEXT || 'p-btn');
    this.renderer.appendChild(BTN, BTN_ICON_SPAN);
    this.renderer.appendChild(BTN, BTN_TEXT_SPAN);
    if (_btnIcon != null) {
      this.setIconClasses(BTN_ICON_SPAN, _btnIcon);
      this.renderer.addClass(BTN_ICON_SPAN, 'p-button-icon');
      if (_btnLabel != null) {
        // has icon & text
        this.renderer.addClass(
          BTN_ICON_SPAN,
          `p-button-icon-${_btnIconPos}`
        );
        if (_btnIconPos == 'right') {
          this.renderer.setStyle(BTN_ICON_SPAN, 'order', 1);
        }
      }
      else {
        // has icon only
        this.renderer.addClass(BTN, 'p-button-icon-only');
      }
    }
    this.addToDOM(BTN, side);
    this.renderer.listen(BTN, 'click', (evt) => {
      if (side === 'after') {
        this.onAfterBtnClick.emit(evt);
      }
      else {
        this.onBeforeBtnClick.emit(evt);
      }
    });
  }

  applyIcon(config: any, side: string) {
    const ICON = this.renderer.createElement('i') as HTMLElement;
    const ICON_SPAN = this.renderer.createElement('span');
    const _icon = config.icon;
    this.setIconClasses(ICON, _icon);
    this.renderer.addClass(ICON_SPAN, 'p-inputgroup-addon');
    this.renderer.appendChild(ICON_SPAN, ICON);
    this.addToDOM(ICON_SPAN, side);
  }

  applyText(config: any, side: string) {
    const TEXT = this.renderer.createText(config.text || null);
    const TEXT_SPAN = this.renderer.createElement('span');
    this.renderer.addClass(TEXT_SPAN, 'p-inputgroup-addon');
    this.renderer.appendChild(TEXT_SPAN, TEXT);
    this.addToDOM(TEXT_SPAN, side);
  }

  setIconClasses(el: HTMLElement, iconClass: string) {
    iconClass.split(' ').forEach(className => {
      this.renderer.addClass(el, className);
    });
  }

  addToDOM(el: any, pos: string) {
    let target = this.el.nativeElement;
    if (target.parentNode.classList.value.includes('p-float-label')) {
      target = target.parentNode;
    }
    target.parentNode.classList.add('p-inputgroup');
    if (pos === 'after') {
      this.el.nativeElement.classList.add('has-after');
      this.renderer.insertBefore(target.parentNode, el, target);
    }
    else if (pos === 'before') {
      this.el.nativeElement.classList.add('has-before');
      this.renderer.appendChild(target.parentNode, el);
    }
  }
}
