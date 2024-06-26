import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from './AuthService';
import { environment } from './environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Api {

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) { }

  get<T>(stub: string, data: Record<string, any>): Observable<T> {
    const params = new URLSearchParams(data);
    const url = `${stub}?${params}`;
    return this.post(url, {});
  }
  post<T>(stub: string, data: Record<string, any>): Observable<T> {
    data['token'] = this.auth.token();
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
    };
    return this.http.post<T>(`${environment.api}/${stub}`, data, httpOptions).pipe(
      catchError((response: HttpErrorResponse) => {
        try {
          const error = response.error.error;
          return throwError(() => new Error(error));
        } catch (e) {
          return throwError(() => new Error("Unexpected API response"));
        }
      })
    );
  }
}
