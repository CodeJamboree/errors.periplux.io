import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { MessageResponse } from '../types/MessageResponse';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  constructor(private http: HttpClient) { }

  login(username: string, password: string): Observable<MessageResponse> {
    const data = { username, password };
    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    };
    return this.http.post<MessageResponse>(`${environment.api}/login`, data, httpOptions).pipe(
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
