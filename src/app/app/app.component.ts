import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LogsComponent } from '../logs/logs.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LogsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Error Log';
}

