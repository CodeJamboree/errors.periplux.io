import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { LogData } from './LogData';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class LogDatesService {
  baseUrl = 'https://dev-api.periplux.io/errors/dates';

  constructor(private http: HttpClient) { }

  getPage(logId: string, pageNumber: number, pageSize: number) {
    let params = new HttpParams()
      .set('log_id', logId)
      .set('page', pageNumber.toString())
      .set('size', pageSize.toString());
    return this.http.get<PaginatedResponse<LogData>>(this.baseUrl, { params });
  }
}
