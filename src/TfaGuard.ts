import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree
} from '@angular/router';
import { AuthService } from './AuthService';

type activateResponse = boolean |
  UrlTree |
  Observable<boolean | UrlTree> |
  Promise<boolean | UrlTree>;

@Injectable({
  providedIn: 'root'
})
export class TfaGuard implements CanActivate {

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  canActivate(
    _route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): activateResponse {
    const canBypass = this.authService.canBypass2FA();
    if (canBypass) return true;
    const extras = {
      queryParams: {
        returnUrl: state.url
      }
    };
    this.router.navigate(['/tfa'], extras);
    return false;
  }
}
