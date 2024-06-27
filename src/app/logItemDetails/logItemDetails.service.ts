import { Injectable } from '@angular/core';
import { LogItemDetailData } from './LogItemDetailData';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { PaginatedResponse } from '../types/PaginatedData';
import { Api } from '../../Api';

@Injectable({
  providedIn: 'root'
})
export class LogItemDetailsService {
  baseUrl = `${environment.api}/details`;

  constructor(private api: Api) { }

  getPage(logId: string, pageNumber: number, pageSize: number) {
    return this.api.get<PaginatedResponse<LogItemDetailData>>('details', {
      log_id: logId,
      page: pageNumber,
      size: pageSize
    }).pipe(
      map(data => {
        data.data.forEach(async (item, i) => {
          item.details = item.details.replaceAll(environment.censor, '***');
        })
        return data;
      }));
  }
}
