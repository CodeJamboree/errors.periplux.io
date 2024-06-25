import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ItemResponse } from '../types/ItemResponse';

@Injectable({
  providedIn: 'root'
})
export class CredentialsService {
  baseUrl = `${environment.api}/change-credentials`;

  constructor(private http: HttpClient) { }

  saveCredentials(username: string, password: string): Observable<ItemResponse<boolean>> {
    const data = {
      username,
      password
    };
    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    };
    return this.http.post<ItemResponse<boolean>>(this.baseUrl, data, httpOptions);
  }
}
