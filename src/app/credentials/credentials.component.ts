import {
  Component,
  Inject
} from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatDialogModule } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { MatInputModule } from "@angular/material/input";
import { MatTableModule } from "@angular/material/table";
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { ProgressSpinnerMode, MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CredentialsData } from './CredentialsData';
import { CredentialsService } from './credentials.service';

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
    MatProgressSpinnerModule
  ],
  standalone: true
})
export class CredentialsComponent {
  original: CredentialsData;
  draft: CredentialsData;
  tfaEnabled: boolean = false;
  savingCredentials: boolean = false;

  constructor(
    private credentialsService: CredentialsService,
    @Inject(MAT_DIALOG_DATA) public data: CredentialsData,
    public dialog: MatDialog,
    private dialogRef: MatDialogRef<CredentialsData, CredentialsData>
  ) {
    this.original = data;
    this.draft = { ...data };
    this.tfaEnabled = this.draft.secrect !== '';
  }
  saveCredentials() {
    this.savingCredentials = true;
    const { username = '', password = '' } = this.draft;
    this.credentialsService.saveCredentials(username, password)
      .subscribe(() => {
        this.original.username = username;
        this.original.password = password;
        this.savingCredentials = false;
      });
  }
  save() {
    this.dialogRef.close(this.original);
  }
  close() {
    this.dialogRef.close(this.original);
  }
}
