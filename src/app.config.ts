import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AgePipe } from './app/pipes/AgePipe';
import { DurationPipe } from './app/pipes/DurationPipe';

import { routes } from './app.routes';
import { AuthGuard } from './AuthGuard';
import { AuthService } from './AuthService';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideAnimations(),
    AuthGuard,
    [{ provide: AuthService, useClass: AuthService, providedIn: 'root' }],
    DatePipe,
    AgePipe,
    DurationPipe
  ]
};
