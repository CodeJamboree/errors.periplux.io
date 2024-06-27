import { Injectable } from '@angular/core';
import { MessageResponse } from '../types/MessageResponse';
import { Api } from '../../Api';

@Injectable({
  providedIn: 'root'
})
export class CredentialsService {
  constructor(private api: Api) { }

  saveCredentials(username: string, password: string) {
    return this.api.post<MessageResponse>('login-change', { username, password });
  }
  saveTwoFactorAuth(secret: string, otp: string) {
    return this.api.post<MessageResponse>('tfa-change', { secret, otp });
  }
  getUserInfo() {
    return this.api.get<{ username: string, tfa_enabled: boolean }>('login-info', {})
  }
}
