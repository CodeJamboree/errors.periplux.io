/* eslint-disable no-console */
import { Component, OnInit } from '@angular/core';
import { NgFor, CommonModule } from '@angular/common';
import { LogsService } from './logs.service';
import { LogComponent } from './log.component';
import { MatDialogModule, MatDialog, MatDialogRef, MatDialogConfig, DialogPosition } from '@angular/material/dialog';
import { LogData } from './LogData';
import { generateMatrixImage } from './generateMatrixImage';
import { errorTypeAsEmoji } from './errorTypeAsEmoji';
@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss'],
  imports: [NgFor, CommonModule, MatDialogModule, LogComponent],
  standalone: true
})
export class LogsComponent implements OnInit {
  data: LogData[] = [];
  totalItems: number = 0;
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 0;
  isDialogOpen: boolean = false;
  errorTypeAsEmoji = errorTypeAsEmoji;
  generateMatrixImage = generateMatrixImage;

  constructor(private logsService: LogsService, public dialog: MatDialog) {
  }

  ngOnInit() {
    this.loadData(this.currentPage);
  }

  loadData(pageNumber: number) {
    this.logsService.getPage(pageNumber, this.pageSize)
      .subscribe(response => {
        this.data = response.data;
        this.totalItems = response.total;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
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

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadData(this.currentPage);
    }
  }

  previousPage() {
    this.currentPage--;
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    if (this.currentPage <= 0) {
      this.currentPage = 1;
    }
    this.loadData(this.currentPage);
  }
}

export class LogsModule { };