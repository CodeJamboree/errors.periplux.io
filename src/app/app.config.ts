import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AgePipe } from './pipes/AgePipe';
import { DurationPipe } from './pipes/DurationPipe';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideAnimations(),
    DatePipe,
    AgePipe,
    DurationPipe
  ]
};
