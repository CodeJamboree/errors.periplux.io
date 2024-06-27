import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LogData } from './LogData';
import { environment } from '../../environments/environment';
import { PaginatedResponse } from '../types/PaginatedData';
import { ItemResponse } from '../types/ItemResponse';
import { Api } from '../../Api';
import { sqlLike } from '../search/sqlLike';

@Injectable({
  providedIn: 'root'
})
export class LogListService {
  baseUrl = `${environment.api}/logs`;

  constructor(private api: Api) { }

  getItem(id: number): Observable<LogData> {
    return this.api.get<ItemResponse<LogData>>('log', { id })
      .pipe(
        map(data =>
          this.transform([data.data])[0]
        ));
  }
  transform(items: LogData[]) {
    items.forEach(async item => {
      item.path = environment.censor(item.path);
      item.message = environment.censor(item.message);
      item.message_hash = await this.hash(item.message);
      item.scope_hash = await this.hash(item.scope);
      item.path_hash = await this.hash(item.path);
    });
    return items;
  }

  getPage(page: number, size: number, search: string) {
    search = sqlLike(search);
    return this.api.get<PaginatedResponse<LogData>>('logs', { page, size, search })
      .pipe(
        map(data => {
          this.transform(data.data);
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
