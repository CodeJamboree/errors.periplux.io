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

import { CredentialsData } from './CredentialsData';
import { CredentialsService } from './credentials.service';
import { alphaNumericOnlyValidator, digitRequiredValidator, lowercaseRequiredValidator, symbolRequiredValidator, uppercaseRequiredValidator } from './validators';

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
    ReactiveFormsModule
  ],
  standalone: true
})
export class CredentialsComponent {
  credentialsForm: FormGroup;
  original: CredentialsData;
  tfaEnabled: boolean = false;
  savingCredentials: boolean = false;
  savingCredentialsError?: string

  constructor(
    private credentialsService: CredentialsService,
    @Inject(MAT_DIALOG_DATA) public data: CredentialsData,
    public dialog: MatDialog,
    private dialogRef: MatDialogRef<CredentialsData, CredentialsData>,
    private fb: FormBuilder
  ) {
    this.original = data;
    this.tfaEnabled = data.secrect !== '';
    this.credentialsForm = this.fb.group({
      username: new FormControl(data.username, [
        Validators.required,
        Validators.minLength(3),
        alphaNumericOnlyValidator
      ]),
      password: new FormControl(data.password, [
        Validators.required,
        Validators.minLength(8),
        lowercaseRequiredValidator,
        uppercaseRequiredValidator,
        digitRequiredValidator,
        symbolRequiredValidator
      ])
    });
  }
  saveCredentials() {
    if (!this.credentialsForm.valid) return;
    this.savingCredentials = true;
    this.savingCredentialsError = undefined;
    const {
      username,
      password
    } = this.credentialsForm.value;
    this.credentialsService.saveCredentials(
      username,
      password
    )
      .subscribe({
        next: () => {
          this.original.username = username;
          this.original.password = password;
        }, error: (error: Error) => {
          this.savingCredentialsError = error.message;
          this.savingCredentials = false;
        }, complete: () => {
          this.savingCredentials = false;
        }
      });
  }
  save() {
    this.dialogRef.close(this.original);
  }
  close() {
    this.dialogRef.close(this.original);
  }
}
