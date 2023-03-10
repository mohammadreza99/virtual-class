import {Global} from '@ng/global';
import {TranslationService} from '@core/utils';

export class LanguageChecker {
  constructor() {
    this.translationService = Global.Injector.get(TranslationService);
    this.translationService.onLangChange().subscribe((res: any) => {
      this._currentLang = res.lang;
      const body = document.querySelector('body');
      if (this.fa) {
        body.style.direction = 'rtl';
        body.classList.add('ng-rtl');
        body.classList.remove('ng-ltr');
      } else if (this.en) {
        body.style.direction = 'ltr';
        body.classList.add('ng-ltr');
        body.classList.remove('ng-rtl');
      }
    });
  }

  private _currentLang: string = localStorage.getItem('lang');
  protected translationService: TranslationService;

  get en(): boolean {
    return this._currentLang === 'en';
  }

  get fa(): boolean {
    return this._currentLang === 'fa';
  }

  get currentLang() {
    return this._currentLang;
  }

  get translations() {
    return this.translationService.translations;
  }

  instant(key: string, params?: any) {
    return this.translationService.instant(key, params) as any;
  }
}
