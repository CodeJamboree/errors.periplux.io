import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LogService {
  private openDialog = new Subject<boolean>();
  isOpen$ = this.openDialog.asObservable();

  open() {
    this.openDialog.next(true);
  }

  close() {
    this.openDialog.next(false);
  }
}
