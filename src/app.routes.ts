import { Routes } from '@angular/router';
import { LogListComponent } from './app/logList/logList.component';
import { LoginComponent } from './app/login/login.component';
import { TfaComponent } from './app/tfa/tfa.component';
import { AuthGuard } from './AuthGuard';
import { TfaGuard } from './TfaGuard';

const allFactors = [
  AuthGuard,
  TfaGuard
]
export const routes: Routes = [
  { path: '', component: LogListComponent, canActivate: allFactors },
  { path: 'login', component: LoginComponent },
  { path: 'tfa', component: TfaComponent, canActivate: [AuthGuard] }
];
