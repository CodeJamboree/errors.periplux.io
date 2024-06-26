import { Injectable } from '@angular/core';
import { AuthenticationStatus } from './AuthenticationStatus';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  status?: AuthenticationStatus;

  isLoggedIn() {
    return this.status?.authenticated ?? false;
  }
  setStatus(status: AuthenticationStatus) {
    this.status = status;
  }
  canBypass2FA(): boolean {
    if (this.status === undefined) return false;
    return this.status.authenticated && !this.status.otp_required;
  }
  token() {
    return this.status?.token;
  }
}