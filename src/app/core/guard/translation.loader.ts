import {Injectable} from '@angular/core';
import {CanLoad, Route, UrlSegment} from '@angular/router';
import {LanguageChecker} from '@shared/components/language-checker/language-checker.component';

@Injectable({
  providedIn: 'root'
})

export class TranslationLoader extends LanguageChecker implements CanLoad {
  constructor() {
    super();
  }

  async canLoad(route: Route, segments: UrlSegment[]): Promise<boolean> {
    try {
      await this.translationService.loadTranslations();
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
}
