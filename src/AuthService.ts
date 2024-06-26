import { Injectable } from '@angular/core';
import { AuthenticationStatus } from './AuthenticationStatus';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  status?: AuthenticationStatus;
  constructor() {
    const json = localStorage.getItem('authentication');
    if (json === null) return;
    try {
      this.status = JSON.parse(json);
    } catch (e) {
    }
  }
  setStatus(status: AuthenticationStatus) {
    this.status = status;
    localStorage.setItem('authentication', JSON.stringify(status));
  }
  isLoggedIn() {
    return this.status?.authenticated ?? false;
  }
  canBypass2FA(): boolean {
    if (this.status === undefined) return false;
    return this.status.authenticated && !this.status.otp_required;
  }
  token() {
    return this.status?.token;
  }
}