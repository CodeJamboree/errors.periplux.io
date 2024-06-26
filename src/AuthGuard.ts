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
export class AuthGuard implements CanActivate {

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): activateResponse {
    if (this.authService.isLoggedIn()) {
      return true;
    } else {
      const extras = {
        queryParams: {
          returnUrl: state.url
        }
      };
      this.router.navigate(['/login'], extras);
      return false;
    }
  }
}
