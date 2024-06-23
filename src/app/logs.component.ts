/* eslint-disable no-console */
import { Component, OnInit, ViewChild } from '@angular/core';
import { NgFor, CommonModule } from '@angular/common';
import { LogsService } from './logs.service';
import { LogComponent } from './log.component';
import { MatDialogModule, MatDialog, MatDialogRef, MatDialogConfig, DialogPosition } from '@angular/material/dialog';
import { LogData } from './LogData';
import { generateMatrixImage } from './generateMatrixImage';
import { errorTypeAsEmoji } from './errorTypeAsEmoji';
import { MatButtonModule } from "@angular/material/button";
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { BrowserAnimationsModule, NoopAnimationsModule } from '@angular/platform-browser/animations';

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss'],
  imports: [
    MatPaginatorModule, NgFor, CommonModule, MatDialogModule, LogComponent, MatButtonModule],
  standalone: true
})
export class LogsComponent implements OnInit {
  @ViewChild('paginator') paginator!: MatPaginator
  pageSizeOptions = [5, 10, 25, 50, 100];
  data: LogData[] = [];
  totalItems: number = 0;
  pageSize: number = 25;
  pageIndex: number = 0;
  isDialogOpen: boolean = false;
  errorTypeAsEmoji = errorTypeAsEmoji;
  generateMatrixImage = generateMatrixImage;

  constructor(private logsService: LogsService, public dialog: MatDialog) {
  }

  ngOnInit() {
    this.loadData(this.pageIndex, this.pageSize);
  }

  loadData(pageIndex: number, pageSize: number) {
    this.logsService.getPage(pageIndex + 1, pageSize)
      .subscribe(response => {
        this.data = response.data;
        this.totalItems = response.total;
      });
  }
  onRowClick(item: LogData) {
    if (this.isDialogOpen) return;
    this.isDialogOpen = true;
    const config = new MatDialogConfig<LogData>();
    config.data = item;
    config.disableClose = false;
    config.hasBackdrop = true;

    const dialogRef = this.dialog.open(LogComponent, config);
    dialogRef.afterClosed().subscribe(dialogResult => {
      this.isDialogOpen = false;
    });
  }
  parseFile(path: string) {
    const i = path.lastIndexOf('/');
    if (i === -1) return '';
    return path.substring(i + 1);
  }
  handlePageEvent(event: PageEvent) {
    this.loadData(event.pageIndex, event.pageSize);
  }
}

export class LogsModule { };