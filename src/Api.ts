import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from './AuthService';
import { environment } from './environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Api {
  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private router: Router
  ) { }
  get<T>(stub: string, data: Record<string, any>): Observable<T> {
    let params = new HttpParams();
    Object.keys(data).forEach(key => {
      params = params.append(key, data[key]);
    })
    const headers: Record<string, string | number> = {};
    this.applyAuthorization(headers);
    const httpOptions = {
      params,
      headers: new HttpHeaders(headers)
    };
    return this.http.get<T>(`${environment.api}/${stub}`, httpOptions).pipe(
      this.errorHandler()
    );
  }
  applyAuthorization(headers: Record<string, string | number>) {
    const token = this.auth.token();
    if (token === undefined) return;
    headers['Authorization'] = `Bearer ${token}`;
  }
  post<T>(stub: string, data: Record<string, any>): Observable<T> {
    const headers: Record<string, string | number> = {
      'Content-Type': 'application/json'
    };
    this.applyAuthorization(headers);
    const httpOptions = {
      headers: new HttpHeaders(headers)
    };
    return this.http.post<T>(`${environment.api}/${stub}`, data, httpOptions).pipe(
      this.errorHandler()
    );
  }
  redirectLogin() {
    this.auth.logout();
    const { pathname, search, hash } = window.location;
    const extras = {
      queryParams: {
        returnUrl: `${pathname}${search}${hash}`
      }
    };
    this.router.navigate(['login'], extras);
  }
  errorHandler<T>() {
    return catchError<T, Observable<never>>((response: HttpErrorResponse) => {
      try {
        const error = response.error.error;
        if (error === "Unauthorized") {
          this.redirectLogin();
        }
        return throwError(() => new Error(error));
      } catch (e) {
        return throwError(() => new Error("Unexpected API response"));
      }
    })
  }
}