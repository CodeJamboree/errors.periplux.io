
import { MatSnackBar } from '@angular/material/snack-bar';

export class Notice {
  private snackBar: MatSnackBar;

  constructor(snackBar: MatSnackBar) {
    this.snackBar = snackBar;
  }
  show(message: string, panelClass: 'error' | 'success' = 'success') {
    this.snackBar.open(message, 'Dismiss', {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass
    });
  }
  error(message: string) {
    this.show(message, 'error');
  }
  success(message: string) {
    this.show(message, 'success');
  }
}
