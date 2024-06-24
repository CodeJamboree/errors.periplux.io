import { Component, Inject, EventEmitter } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { LogData } from './LogData';
import { LogDatesComponent } from './logDates.component';
import { LogDetailsComponent } from './logDetails.component';
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatDialogModule } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { MatInputModule } from "@angular/material/input";
import { MatTableModule } from "@angular/material/table";
import { generateMatrixImage } from './generateMatrixImage';
import { CommonModule } from '@angular/common';
import { errorTypeAsEmoji } from './errorTypeAsEmoji';
import { errorNumberAsType } from './errorNumberAsType';
import { DurationPipe } from './DurationPipe';
import { AgePipe } from './AgePipe';

interface NextLogEvent {
  id: number,
  setLog: (data: LogData) => void
};

@Component({
  selector: 'app-log',
  templateUrl: './log.component.html',
  styleUrls: ['./log.component.scss'],
  imports: [
    LogDetailsComponent,
    LogDatesComponent,
    AgePipe,
    DurationPipe,
    CommonModule,
    FlexLayoutModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatTableModule
  ],
  standalone: true
})
export class LogComponent {
  item: LogData
  nextItemEvent = new EventEmitter<NextLogEvent>();
  priorItemEvent = new EventEmitter<NextLogEvent>();

  errorTypeAsEmoji = errorTypeAsEmoji;
  generateMatrixImage = generateMatrixImage;
  errorNumberAsType = errorNumberAsType;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: LogData,
    public dialog: MatDialog,
    private dialogRef: MatDialogRef<LogComponent>
  ) {
    this.item = data;
  }
  evaluatedType() {
    return errorNumberAsType(this.item.type);
  }
  originalType() {
    if (this.evaluatedType() === this.item.type) return "";
    return `(${this.item.type})`;
  }
  durationMs() {
    return (this.item.last_at - this.item.first_at) * 1000;
  }
  setData(data: LogData) {
    this.item = data;
  }
  next() {
    this.nextItemEvent.emit({ id: this.item.id, setLog: this.setData.bind(this) });
  }
  prior() {
    this.priorItemEvent.emit({ id: this.item.id, setLog: this.setData.bind(this) });
  }
  close() {
    this.dialogRef.close();
  }

}
