import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LogData } from './LogData';
import { environment } from '../environments/environment';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
}
interface ItemResponse<T> {
  data: T
}

@Injectable({
  providedIn: 'root'
})
export class LogsService {
  baseUrl = `${environment.api}/logs`;

  constructor(private http: HttpClient) { }

  getItem(id: number): Observable<LogData> {
    let params = new HttpParams()
      .set('id', id.toString());
    return this.http.get<ItemResponse<LogData>>(`${environment.api}/log`, { params })
      .pipe(
        map(data => {
          const items = [data.data];
          items.forEach(async item => {
            item.path = environment.censor(item.path);
            item.message = environment.censor(item.message);
            item.message_hash = await this.hash(item.message);
            item.scope_hash = await this.hash(item.scope);
            item.path_hash = await this.hash(item.path);
          })
          return items[0];
        }));
  }

  sqlLike(search: string) {
    if (search.trim() === '') return '';
    if (!search.includes('"')) return search.trim().replaceAll(' ', '%');
    // every space outside of quotes changes to percent 
    // remove quotes
    let like = '';
    const pattern = /([^"]*)"([^"]*)"([^"]*)/g;
    const matches = search.matchAll(pattern);

    for (const match of matches) {
      // unquoted prefix
      if (match[1].trim() !== '') {
        if (like.length !== 0) like += '%';
        like += match[1].trim().replaceAll(' ', '%');
      }
      // quoted
      if (match[2].trim() !== '') {
        if (like.length !== 0) like += '%';
        like += match[2].trim();
      }
      // unquoted suffix
      if (match[3].trim() !== '') {
        if (like.length !== 0) like += '%';
        like += match[3].trim().replaceAll(' ', '%');
      }
    }
    return like;
  }
  getPage(pageNumber: number, pageSize: number, search: string): Observable<PaginatedResponse<LogData>> {
    let params = new HttpParams()
      .set('page', pageNumber.toString())
      .set('size', pageSize.toString())
      .set('search', this.sqlLike(search));
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
