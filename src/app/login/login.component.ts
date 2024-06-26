import { Component, Inject } from '@angular/core';
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatInputModule } from "@angular/material/input";
import { MatTableModule } from "@angular/material/table";
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, FormGroup, FormControl, Validators, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import {
  alphaNumericOnlyValidator,
  digitRequiredValidator,
  lowercaseRequiredValidator,
  symbolRequiredValidator,
  uppercaseRequiredValidator
} from '../validators';
import { LoginService } from './login.service';
import { Notice } from '../Notice';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FlexLayoutModule,
    MatButtonModule,
    MatInputModule,
    MatTableModule,
    MatFormFieldModule,
    FormsModule,
    MatCardModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatSnackBarModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  loginForm: FormGroup;
  waiting: boolean = false;
  notice: Notice;

  constructor(
    private loginService: LoginService,
    @Inject(MatSnackBar) private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.notice = new Notice(snackBar);
    this.loginForm = this.fb.group({
      username: new FormControl('', [
        Validators.required,
        Validators.minLength(3),
        alphaNumericOnlyValidator
      ]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(8),
        lowercaseRequiredValidator,
        uppercaseRequiredValidator,
        digitRequiredValidator,
        symbolRequiredValidator
      ])
    });

  }

  login() {
    if (!this.loginForm.valid) return;
    this.waiting = true;
    const {
      username,
      password
    } = this.loginForm.value;
    this.loginService.login(username, password)
      .subscribe({
        next: result => {
          this.notice.success(result.message);
        }, error: (error: Error) => {
          this.notice.error(error.message);
          this.waiting = false;
        }, complete: () => {
          this.waiting = false;
        }
      });
  }

}
