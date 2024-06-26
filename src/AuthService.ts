import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError, of, map } from 'rxjs';
import { environment } from './environments/environment';

interface EnabledResponse {
  enabled: boolean
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  authenticated: boolean = false;
  tfaEnabled?: boolean;
  tfaAuthenticated: boolean = false;

  constructor(private http: HttpClient) { }

  isLoggedIn() {
    return this.authenticated;
  }
  setIsLoggedIn(value: boolean) {
    this.authenticated = value;
  }
  setIsTfaAuthenticated(value: boolean) {
    this.tfaAuthenticated = value;
  }
  canBypass2FA(): Observable<boolean> {
    if (this.tfaEnabled !== undefined) {
      return of(this.tfaEnabled ? this.tfaAuthenticated : true);
    }
    const data = {};
    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    };
    return this.http.post<EnabledResponse>(
      `${environment.api}/tfa-enabled`,
      data,
      httpOptions
    ).pipe(
      map(response => {
        this.tfaEnabled = response.enabled;
        return this.tfaEnabled ? this.tfaAuthenticated : true;
      }),
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