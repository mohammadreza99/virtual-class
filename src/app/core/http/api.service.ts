import {HttpClient, HttpContext, HttpHeaders, HttpParams} from '@angular/common/http';
import {Global} from '@ng/global';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {EnvService} from '@core/utils';

interface RequestOptions {
  headers?: HttpHeaders | { [p: string]: string | string[] };
  context?: HttpContext;
  params?: HttpParams | { [p: string]: string | number | boolean | readonly (string | number | boolean)[] };
  reportProgress?: boolean;
  withCredentials?: boolean;
}

export class ApiService {
  constructor() {
    this.http = Global.Injector.get(HttpClient);
    this.envService = Global.Injector.get(EnvService);
    this.baseUrl = this.envService.apiUrl;
    this.socketBaseUrl = this.envService.socketUrl;
  }

  protected http: HttpClient;
  private envService: EnvService;
  private baseUrl: string;
  protected socketBaseUrl: string;

  protected _post<T>(
    endpoint: string,
    data: any,
    options: RequestOptions = null,
    mappingKey: string = null
  ): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}`, data, {
      ...options,
      params: this.getHttpParams(options?.params)
    }).pipe(
      map((res: any) => {
        return !mappingKey ? res : (res[mappingKey] as T);
      })
    );
  }

  protected getFormData(obj: any, excludes: string[] = []): FormData {
    const formData = new FormData();
    for (const key in obj) {
      const value = obj[key];
      if (Array.isArray(value)) {
        // typeof Array
        for (let i = 0; i < value.length; i++) {
          formData.append(key + '[' + i + ']', value[i]);
        }
      } else if (typeof value === 'object' && excludes.indexOf(key) === -1) {
        // typeof Object
        if (value instanceof Date) {
          value.setHours(0, -value.getTimezoneOffset(), 0, 0);
          formData.append(key, (value as Date).toISOString());
        } else {
          for (const subkey in value) {
            formData.append(`${key}[${subkey}]`, value[subkey]);
          }
        }
      } else {
        // typeof Regular
        formData.append(key, value);
      }
    }
    return formData;
  }

  private getHttpParams(params: any): HttpParams {
    let httpParams: HttpParams = new HttpParams();
    if (params) {
      Object.keys(params).map((x: string) => {
        httpParams = httpParams.set(x, params[x]);
      });
    }
    return httpParams;
  }
}
