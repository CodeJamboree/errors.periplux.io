import { Routes } from '@angular/router';
import { LogListComponent } from './app/logList/logList.component';
import { LoginComponent } from './app/login/login.component';
import { AuthGuard } from './AuthGuard';

export const routes: Routes = [
  { path: '', component: LogListComponent, pathMatch: 'full', canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent }
];
