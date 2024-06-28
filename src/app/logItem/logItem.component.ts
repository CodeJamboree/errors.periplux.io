import {
  Component,
  Inject,
  EventEmitter,
  OnInit,
  OnDestroy
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatDialogModule } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { MatInputModule } from "@angular/material/input";
import { MatTableModule } from "@angular/material/table";
import { CommonModule } from '@angular/common';

import { LogData } from '../logList/LogData';
import { LogItemDatesComponent } from '../logItemDates/logItemDates.component';
import { LogItemDetailsComponent } from '../logItemDetails/logItemDetails.component';
import { generateMatrixImage } from '../logList/utils/generateMatrixImage';
import { errorTypeAsEmoji } from '../logList/utils/errorTypeAsEmoji';
import { errorNumberAsType } from '../logList/utils/errorNumberAsType';
import { DurationPipe } from '../pipes/DurationPipe';
import { AgePipe } from '../pipes/AgePipe';
import { highlightSearchTerms } from '../search/highlightSearchTerms';

interface NextLogEvent {
  id: number,
  setLog: (data: LogData) => void
};

@Component({
  selector: 'log-item',
  templateUrl: './logItem.component.html',
  styleUrls: ['./logItem.component.scss'],
  imports: [
    LogItemDetailsComponent,
    LogItemDatesComponent,
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
export class LogItemComponent implements OnInit, OnDestroy {
  item: LogData
  searchText: string = '';
  nextItemEvent = new EventEmitter<NextLogEvent>();
  priorItemEvent = new EventEmitter<NextLogEvent>();

  errorTypeAsEmoji = errorTypeAsEmoji;
  generateMatrixImage = generateMatrixImage;
  errorNumberAsType = errorNumberAsType;
  boundKeydown: (event: KeyboardEvent) => void;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { item: LogData, search: string },
    @Inject(DOCUMENT) private document: Document,
    public dialog: MatDialog,
    private dialogRef: MatDialogRef<LogItemComponent>
  ) {
    this.item = data.item;
    this.searchText = data.search;
    this.boundKeydown = this.handleKeydown.bind(this);
  }
  handleKeydown({ key, code }: KeyboardEvent) {
    const name = key ?? code;
    switch (name) {
      case 'ArrowLeft':
      case 'ArrowUp':
        this.prior();
        return;
      case 'ArrowRight':
      case 'ArrowDown':
        this.next();
        return;
      default: break;
    }
  }
  ngOnInit(): void {
    this.boundKeydown = this.handleKeydown.bind(this);
    this.document.addEventListener('keydown', this.boundKeydown);
  }
  ngOnDestroy(): void {
    this.document.removeEventListener('keydown', this.boundKeydown);
  }
  evaluatedType() {
    return errorNumberAsType(this.item.type);
  }
  originalType() {
    if (this.evaluatedType() === this.item.type) return "";
    return `(${this.item.type})`;
  }
  searchParts(text: string) {
    return highlightSearchTerms(text, this.searchText);
  }
  durationMs() {
    return (this.item.last_at - this.item.first_at) * 1000;
  }
  setLog(data: LogData) {
    this.item = data;
  }
  next() {
    this.nextItemEvent.emit({
      id: this.item.id,
      setLog: this.setLog.bind(this)
    });
  }
  prior() {
    this.priorItemEvent.emit({
      id: this.item.id,
      setLog: this.setLog.bind(this)
    });
  }
  close() {
    this.dialogRef.close();
  }
}
