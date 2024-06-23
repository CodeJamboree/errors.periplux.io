import { Component, OnInit, ViewChild } from '@angular/core';
import { NgFor, CommonModule } from '@angular/common';
import { MatDialogModule, MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatButtonModule } from "@angular/material/button";
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';

import { LogsService } from './logs.service';
import { LogComponent } from './log.component';
import { LogData } from './LogData';
import { generateMatrixImage } from './generateMatrixImage';
import { errorTypeAsEmoji } from './errorTypeAsEmoji';

const defaultPageSize = 25;

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss'],
  imports: [
    MatPaginatorModule,
    NgFor,
    CommonModule,
    MatDialogModule,
    LogComponent,
    MatButtonModule
  ],
  standalone: true
})
export class LogsComponent implements OnInit {
  @ViewChild('paginator') paginator!: MatPaginator
  pageSizeOptions = [5, 10, 25, 50, 100];
  totalItems: number = 0;
  pageSize: number = defaultPageSize;
  pageIndex: number = -1;
  data: LogData[] = [];
  isDialogOpen: boolean = false;
  errorTypeAsEmoji = errorTypeAsEmoji;
  generateMatrixImage = generateMatrixImage;

  constructor(
    private logsService: LogsService,
    public dialog: MatDialog,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {
  }

  ngOnInit() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const page = this.activatedRoute.snapshot.queryParamMap.get('page');
        const size = this.activatedRoute.snapshot.queryParamMap.get('size');
        let pageIndex = page ? parseInt(page, 10) - 1 : 0;
        if (pageIndex < 0) pageIndex = 0;
        let pageSize = size ? parseInt(size, 10) : defaultPageSize;
        if (!this.pageSizeOptions.includes(pageSize)) {
          pageSize = defaultPageSize;
        }
        this.loadData(pageIndex, pageSize);
      }
    });
  }

  loadData(pageIndex: number, pageSize: number) {
    if (pageIndex === this.pageIndex && pageSize === this.pageSize) {
      return;
    }
    this.logsService.getPage(pageIndex + 1, pageSize)
      .subscribe(response => {
        this.pageSize = pageSize;
        this.pageIndex = pageIndex;
        this.data = response.data;
        this.totalItems = response.total;
        this.router.navigate([''], {
          queryParams: {
            page: pageIndex + 1,
            size: pageSize
          }
        })
      });
  }
  handlePageEvent(event: PageEvent) {
    this.loadData(event.pageIndex, event.pageSize);
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
}

export class LogsModule { };