import { Routes } from '@angular/router';
import { LogsGridComponent } from './app/logsGrid/logsGrid.component';
import { LoginComponent } from './app/login/login.component';

export const routes: Routes = [
  { path: '', component: LogsGridComponent, pathMatch: 'full' },
  { path: 'login', component: LoginComponent }
];
