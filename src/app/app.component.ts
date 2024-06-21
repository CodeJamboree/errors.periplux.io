import { Component, ViewChild, ViewContainerRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LogsComponent } from './logs.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LogsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  @ViewChild('logsContainer', { read: ViewContainerRef })
  title = 'Error Log';
}
