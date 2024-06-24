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
  selectedId: number = -1;
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
        const id = this.activatedRoute.snapshot.queryParamMap.get('id');

        let pageIndex = page ? parseInt(page, 10) - 1 : 0;
        if (pageIndex < 0) pageIndex = 0;
        let pageSize = size ? parseInt(size, 10) : defaultPageSize;
        if (!this.pageSizeOptions.includes(pageSize)) {
          pageSize = defaultPageSize;
        }
        let logId = id ? parseInt(id, 10) : -1;
        this.selectedId = logId;
        this.loadData(pageIndex, pageSize);
      }
    });
  }

  updateQueryPrams() {
    const queryParams: {
      page?: number,
      size?: number,
      id?: number
    } = {};
    if (this.pageIndex !== 0) queryParams.page = this.pageIndex + 1;
    if (this.pageSize !== defaultPageSize) queryParams.size = this.pageSize;
    if (this.selectedId !== -1) queryParams.id = this.selectedId;
    this.router.navigate([''], {
      queryParams
    })
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
        this.updateQueryPrams();
        this.loadSelected();
      });
  }
  loadSelected() {
    if (this.selectedId === -1) return;
    const selected = this.data.find(({ id }) => id === this.selectedId);
    if (selected) {
      this.onRowClick(selected);
      return;
    }
    this.logsService.getItem(this.selectedId)
      .subscribe(item => {
        this.onRowClick(item);
      })
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
    config.autoFocus = "#nextButton"
    config.minWidth = "50%";
    config.maxWidth = "90%";
    config.width = "1000px";
    config.minHeight = "50%";
    config.maxHeight = "90%";
    config.height = "1000px";

    this.selectedId = item.id;
    this.updateQueryPrams();
    const dialogRef = this.dialog.open<LogComponent, LogData>(LogComponent, config);
    dialogRef.componentInstance.nextItemEvent.subscribe(event => {
      console.log('handling nextItemEvent for ' + item.id);
      let index = this.data.findIndex(item => item.id === event.id);
      index = ++index % this.data.length;
      this.selectedId = this.data[index].id;
      this.updateQueryPrams();
      event.setLog(this.data[index]);
    });
    dialogRef.componentInstance.priorItemEvent.subscribe(event => {
      console.log('handling priorItemEvent for ' + item.id);
      let index = this.data.findIndex(item => item.id === event.id);
      index--;
      if (index < 0) index = this.data.length - 1;
      this.selectedId = this.data[index].id;
      this.updateQueryPrams();
      event.setLog(this.data[index]);
    });
    dialogRef.afterClosed().subscribe(() => {
      this.isDialogOpen = false;
      this.selectedId = -1;
      this.updateQueryPrams();
    });
  }
  selectedClass(id: number) {
    return id === this.selectedId ? 'selected' : '';
  }
  parseFile(path: string) {
    const i = path.lastIndexOf('/');
    if (i === -1) return '';
    return path.substring(i + 1);
  }
}

export class LogsModule { };