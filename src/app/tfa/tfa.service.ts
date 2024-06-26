import { Injectable } from '@angular/core';
import { AuthenticationStatus } from '../../AuthenticationStatus';
import { Api } from '../../Api';

@Injectable({
  providedIn: 'root'
})
export class TfaService {
  constructor(private api: Api) { }
  verify(otp: string) {
    return this.api.post<AuthenticationStatus>('tfa-verify', { otp });
  }
}
