import { Routes } from '@angular/router';
import { LogsComponent } from './app/logs/logs.component';
import { LoginComponent } from './app/login/login.component';

export const routes: Routes = [
  { path: '', component: LogsComponent, pathMatch: 'full' },
  { path: 'login', component: LoginComponent }
];
