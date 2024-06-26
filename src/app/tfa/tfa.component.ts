import { Component, Inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatDialogModule } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { MatInputModule } from "@angular/material/input";
import { MatTableModule } from "@angular/material/table";
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, FormGroup, FormControl, Validators, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { TfaService } from './tfa.service';
import { Notice } from '../Notice';
import { AuthService } from '../../AuthService';
@Component({
  selector: 'app-tfa',
  standalone: true,
  imports: [
    CommonModule,
    FlexLayoutModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatTableModule,
    MatFormFieldModule,
    FormsModule,
    MatSlideToggleModule,
    MatCardModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatSnackBarModule
  ],
  templateUrl: './tfa.component.html',
  styleUrl: './tfa.component.scss'
})
export class TfaComponent implements OnInit {
  tfaForm: FormGroup;
  waiting: boolean = false;
  notice: Notice;
  returnUrl?: string;
  verified: boolean = false;

  constructor(
    private tfaService: TfaService,
    @Inject(MatSnackBar) private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService
  ) {
    this.notice = new Notice(snackBar);
    this.tfaForm = this.fb.group({
      otp: new FormControl<string>({
        value: '',
        disabled: false
      }, [
        Validators.minLength(6),
        Validators.maxLength(6),
        Validators.pattern(/^\d+$/)
      ])
    });
  }
  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.returnUrl = params['returnUrl'];
    });
  }
  async verify() {
    if (!this.tfaForm.valid) return;
    this.waiting = true;
    const {
      otp,
    } = this.tfaForm.value;
    this.tfaService.verify(otp)
      .subscribe({
        next: (result) => {
          this.auth.setIsTfaAuthenticated(result);
          this.verified = result;
          if (!result) {
            this.notice.error("Incorrect OTP provided");
          }
        }, error: (error: Error) => {
          this.notice.error(error.message);
          this.waiting = false;
        }, complete: () => {
          this.waiting = false;
          this.navigateToReturnUrl();
        }
      });
  }
  navigateToReturnUrl() {
    this.router.navigateByUrl(this.returnUrl ?? '/');
  }
}
