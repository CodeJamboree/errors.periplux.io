import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
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
    return this.http.post<ItemResponse<boolean>>(this.baseUrl, data, httpOptions).pipe(
      catchError((response: HttpErrorResponse) => {
        try {
          const error = response.error.error;
          return throwError(() => new Error(error));
        } catch (e) {
          console.log('http error: ', response);
          // unexpected response wasn't json? maybe we should log this
          // details: response.error
          // message: response.message
          // code: response.status = 500
          // code: response.statusText = "OK"
          // path: response.url = https://...;
          // type: response.name = HttpErrorResponse
        }
        return throwError(() => new Error(response.error));
      })
    );
  }
}
