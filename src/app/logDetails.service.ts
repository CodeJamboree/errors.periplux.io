import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { LogDetailData } from './LogDetailData';
import { map } from 'rxjs/operators';
import { environment } from '../environments/environment';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class LogDetailsService {
  baseUrl = 'https://dev-api.periplux.io/errors/details';

  constructor(private http: HttpClient) { }

  getPage(logId: string, pageNumber: number, pageSize: number) {
    let params = new HttpParams()
      .set('log_id', logId)
      .set('page', pageNumber.toString())
      .set('size', pageSize.toString());
    return this.http.get<PaginatedResponse<LogDetailData>>(this.baseUrl, { params }).pipe(
      map(data => {
        data.data.forEach(async (item, i) => {
          item.details = environment.censor(item.details);
        })
        return data;
      }));
  }
}
