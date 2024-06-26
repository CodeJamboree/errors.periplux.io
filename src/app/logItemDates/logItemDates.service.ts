import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { LogItemDateData } from './LogItemDateData';
import { environment } from '../../environments/environment';
import { PaginatedResponse } from '../types/PaginatedData';

@Injectable({
  providedIn: 'root'
})
export class LogItemDatesService {
  baseUrl = `${environment.api}/dates`;

  constructor(private http: HttpClient) { }

  getPage(logId: string, pageNumber: number, pageSize: number) {
    let params = new HttpParams()
      .set('log_id', logId)
      .set('page', pageNumber.toString())
      .set('size', pageSize.toString());
    return this.http.get<PaginatedResponse<LogItemDateData>>(this.baseUrl, { params });
  }
}
