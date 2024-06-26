import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError, map } from 'rxjs';
import { environment } from '../../environments/environment';

interface VerifiedResponse {
  verified: boolean
};

@Injectable({
  providedIn: 'root'
})
export class TfaService {
  constructor(private http: HttpClient) { }

  verify(otp: string): Observable<boolean> {
    const data = { otp };
    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    };
    return this.http.post<VerifiedResponse>(`${environment.api}/tfa-verify`, data, httpOptions).pipe(
      map(response => response.verified),
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
