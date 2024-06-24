import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app.config';
import { AppComponent } from './app/app/app.component';
console.log('main.ts');
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
