import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { LogData } from './LogData';
import { environment } from '../environments/environment';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class LogsService {
  baseUrl = `${environment.api}/logs`;

  constructor(private http: HttpClient) { }

  getPage(pageNumber: number, pageSize: number) {
    let params = new HttpParams()
      .set('page', pageNumber.toString())
      .set('size', pageSize.toString());
    return this.http.get<PaginatedResponse<LogData>>(this.baseUrl, { params })
      .pipe(
        map(data => {
          data.data.forEach(async (item, i) => {
            item.path = environment.censor(item.path);
            item.message = environment.censor(item.message);
            item.message_hash = await this.hash(item.message);
            item.scope_hash = await this.hash(item.scope);
            item.path_hash = await this.hash(item.path);
          })
          return data;
        }));
  }
  async hash(text: string): Promise<string> {
    if (text.trim() === '') return '';
    const data = new TextEncoder().encode(text);
    const buffer: ArrayBuffer = await crypto.subtle.digest({ name: 'SHA-256' }, data);
    const hex = Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    return hex;
  }
}
