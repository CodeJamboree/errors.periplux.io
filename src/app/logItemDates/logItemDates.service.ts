import { Injectable } from '@angular/core';
import { LogItemDateData } from './LogItemDateData';
import { environment } from '../../environments/environment';
import { PaginatedResponse } from '../types/PaginatedData';
import { Api } from '../../Api';

@Injectable({
  providedIn: 'root'
})
export class LogItemDatesService {
  baseUrl = `${environment.api}/dates`;

  constructor(private api: Api) { }

  getPage(logId: string, pageNumber: number, pageSize: number) {
    return this.api.get<PaginatedResponse<LogItemDateData>>('dates', {
      log_id: logId,
      page: pageNumber,
      size: pageSize
    });
  }
}
