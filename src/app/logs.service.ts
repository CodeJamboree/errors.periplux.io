import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

interface LogResult {
  id: number,
  scope: string,
  last_at: number,
  type: string,
  message: string,
  path: string,
  line: number,
  count: number
}

@Injectable({
  providedIn: 'root'
})
export class LogsService {
  baseUrl = 'https://dev-api.periplux.io/errors/logs';

  constructor(private http: HttpClient) { }

  getPage(pageNumber: number, pageSize: number) {
    let params = new HttpParams()
      .set('page', pageNumber.toString())
      .set('size', pageSize.toString());
    return this.http.get<PaginatedResponse<LogResult>>(this.baseUrl, { params });
  }
}
