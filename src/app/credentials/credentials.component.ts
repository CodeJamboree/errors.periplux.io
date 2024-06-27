import { Component, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
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

import { QrCodeModule } from 'ng-qrcode';

import { CredentialsService } from './credentials.service';
import { Notice } from '../Notice';

import {
  alphaNumericOnlyValidator,
  digitRequiredValidator,
  lowercaseRequiredValidator,
  symbolRequiredValidator,
  uppercaseRequiredValidator,
  conditionallyRequredValidator
} from '../validators';
import { TwoFactorAuth } from './TwoFactorAuth';
@Component({
  selector: 'app-credentials',
  templateUrl: './credentials.component.html',
  styleUrls: ['./credentials.component.scss'],
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
    QrCodeModule,
    MatSnackBarModule
  ],
  standalone: true
})
export class CredentialsComponent {
  credentialsForm: FormGroup;
  tfaForm: FormGroup;
  savingCredentials: boolean = false;
  savingTfa: boolean = false;
  newSecret: string = '';
  provisionUrl: string = '';
  notice: Notice;
  provisionAccount: string = '';

  constructor(
    private credentialsService: CredentialsService,
    @Inject(MatSnackBar) private snackBar: MatSnackBar,
    public dialog: MatDialog,
    private dialogRef: MatDialogRef<never>,
    private fb: FormBuilder
  ) {
    this.notice = new Notice(snackBar);
    // this.newSecret = TwoFactorAuth.generate_secret();
    // const tfa = new TwoFactorAuth(this.newSecret);
    // let issuer = document.title;
    // this.provisionUrl = tfa.generate_provisioning_uri({ account: '', issuer });

    this.credentialsForm = this.fb.group({
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
    this.tfaForm = this.fb.group({
      otp: new FormControl<string>({
        value: '',
        disabled: true
      }, [
        Validators.minLength(6),
        Validators.maxLength(6),
        Validators.pattern(/^\d+$/),
        conditionallyRequredValidator(() => {
          if (!this.tfaForm) return false;
          return Boolean(this.tfaForm.get('enabled')?.value)
        }),
      ]),
      enabled: new FormControl<boolean>({
        value: false,
        disabled: false
      })
    });
    this.loadUserInfo();
  }
  loadUserInfo() {
    this.savingCredentials = true;
    this.credentialsService.getUserInfo().subscribe({
      next: (info) => {
        this.credentialsForm.get('username')?.setValue(info.username);
        this.tfaForm.get('enabled')?.setValue(info.tfa_enabled);
        this.changeTfaEnabled();
      },
      error: (error: Error) => {
        this.savingCredentials = false;
        this.notice.error(error.message);
      },
      complete: () => {
        this.savingCredentials = false;
      }
    })
  }
  changeSecret() {
    if (!(this.tfaForm.get('enabled')?.value ?? false)) {
      this.newSecret = '';
      this.provisionUrl = '';
      return;
    }
    const username = this.credentialsForm.get('username')?.value ?? '';
    if (this.newSecret !== '' && this.provisionAccount === username) {
      return;
    }
    this.provisionAccount = username;
    this.newSecret = TwoFactorAuth.generate_secret();
    const tfa = new TwoFactorAuth(this.newSecret);
    this.provisionUrl = tfa.generate_provisioning_uri({
      account: username,
      issuer: document.title
    });
  }
  changeTfaEnabled() {
    const enabled = Boolean(this.tfaForm.get('enabled')?.value);
    if (enabled) {
      this.tfaForm.get('otp')?.enable();
    } else {
      this.tfaForm.get('otp')?.disable();
    }
    this.changeSecret();
  }
  saveCredentials() {
    if (!this.credentialsForm.valid) return;
    this.savingCredentials = true;
    const {
      username,
      password
    } = this.credentialsForm.value;
    this.credentialsService.saveCredentials(
      username,
      password
    )
      .subscribe({
        next: result => {
          this.notice.success(result.message);
        }, error: (error: Error) => {
          this.notice.error(error.message);
          this.savingCredentials = false;
        }, complete: () => {
          this.savingCredentials = false;
          // if username changed
          this.changeSecret();
        }
      });
  }
  async saveTwoFactorAuth() {
    if (!this.tfaForm.valid) return;
    this.savingTfa = true;
    const {
      otp,
      enabled
    } = this.tfaForm.value;
    let secret = '';
    if (enabled) {
      secret = this.newSecret;
      const tfa = new TwoFactorAuth(secret)
      let expectedOta = await tfa.otp();
      if (expectedOta !== otp) {
        expectedOta = await tfa.get_relative_otp(-1);
      }
      if (expectedOta !== otp) {
        expectedOta = await tfa.get_relative_otp(1);
      }
      if (expectedOta !== otp) {
        this.notice.error('Incorrect OTP provided.');
        this.savingTfa = false;
        return;
      }
    }
    this.credentialsService.saveTwoFactorAuth(secret, otp)
      .subscribe({
        next: (result) => {
          this.notice.success(result.message);
        }, error: (error: Error) => {
          this.notice.error(error.message);
          this.savingTfa = false;
        }, complete: () => {
          this.savingTfa = false;
        }
      });
  }
  close() {
    this.dialogRef.close();
  }
}
