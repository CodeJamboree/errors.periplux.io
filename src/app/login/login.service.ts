import { Injectable } from '@angular/core';
import { AuthenticationStatus } from '../../AuthenticationStatus';
import { Api } from '../../Api';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  constructor(private api: Api) { }

  login(username: string, password: string) {
    return this.api.post<AuthenticationStatus>('login', { username, password });
  }
}
