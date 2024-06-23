import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { LogData } from './LogData';
import { environment } from '../environments/environment';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class LogDatesService {
  baseUrl = `${environment.api}/dates`;

  constructor(private http: HttpClient) { }

  getPage(logId: string, pageNumber: number, pageSize: number) {
    let params = new HttpParams()
      .set('log_id', logId)
      .set('page', pageNumber.toString())
      .set('size', pageSize.toString());
    return this.http.get<PaginatedResponse<LogData>>(this.baseUrl, { params });
  }
}
