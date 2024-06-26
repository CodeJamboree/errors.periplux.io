import { Routes } from '@angular/router';
import { LogListComponent } from './app/logList/logList.component';
import { LoginComponent } from './app/login/login.component';

export const routes: Routes = [
  { path: '', component: LogListComponent, pathMatch: 'full' },
  { path: 'login', component: LoginComponent }
];
