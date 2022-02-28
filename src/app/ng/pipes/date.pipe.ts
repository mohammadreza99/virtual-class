import {Pipe, PipeTransform} from '@angular/core';
import * as moment from 'jalali-moment';

@Pipe({
  name: 'ngDate',
})
export class DatePipe implements PipeTransform {
  constructor() {
  }

  transform(value: any, locale: 'fa-ir' | 'en-us'): string {
    if (value) {
      const stillUtc = moment.utc(value).toDate();
      const local = moment(stillUtc).local().format('YYYY-MM-DD HH:mm');
      return new Date(local).toLocaleString(locale, {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return null;
    }
  }
}
