import { Component, OnInit, ViewChild } from '@angular/core';
import { NgFor, CommonModule } from '@angular/common';
import { MatDialogModule, MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { LogsService } from './logsGrid.service';
import { LogComponent } from '../log/log.component';
import { LogData } from './LogData';
import { generateMatrixImage } from './utils/generateMatrixImage';
import { errorTypeAsEmoji } from './utils/errorTypeAsEmoji';
import { highlightSearchTerms } from '../search/highlightSearchTerms';
import { LogComponentData } from '../log/LogComponentData';
import { CredentialsComponent } from '../credentials/credentials.component';
import { CredentialsData } from '../credentials/CredentialsData';

const defaultPageSize = 25;

@Component({
  selector: 'logs-grid',
  templateUrl: './logsGrid.component.html',
  styleUrls: ['./logsGrid.component.scss'],
  imports: [
    MatPaginatorModule,
    NgFor,
    CommonModule,
    MatDialogModule,
    LogComponent,
    MatButtonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule
  ],
  standalone: true
})
export class LogsGridComponent implements OnInit {
  @ViewChild('paginator') paginator!: MatPaginator
  pageSizeOptions = [5, 10, 25, 50, 100];
  totalItems: number = 0;
  pageSize: number = defaultPageSize;
  pageIndex: number = -1;
  selectedId?: number;
  searchInput: string = '';
  searchText: string = '';
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
        const searchText = this.activatedRoute.snapshot.queryParamMap.get('search') ?? '';

        let pageIndex = page ? parseInt(page, 10) - 1 : 0;
        if (pageIndex < 0) pageIndex = 0;
        let pageSize = size ? parseInt(size, 10) : defaultPageSize;
        if (!this.pageSizeOptions.includes(pageSize)) {
          pageSize = defaultPageSize;
        }
        let logId = id ? parseInt(id, 10) : undefined;

        this.selectedId = logId;
        this.searchInput = searchText;
        this.loadData(pageIndex, pageSize, searchText);
      }
    });
  }

  updateQueryPrams() {
    const queryParams: {
      page?: number,
      size?: number,
      id?: number,
      search?: string
    } = {};
    if (this.pageIndex !== 0) queryParams.page = this.pageIndex + 1;
    if (this.pageSize !== defaultPageSize) queryParams.size = this.pageSize;
    if (this.selectedId && this.selectedId > 0) queryParams.id = this.selectedId;
    if (this.searchText.trim() !== '') queryParams.search = this.searchText.trim();
    this.router.navigate([''], {
      queryParams
    })
  }
  search() {
    this.loadData(0, this.pageSize, this.searchInput);
  }
  searchParts(text: string) {
    return highlightSearchTerms(text, this.searchText);
  }
  loadData(pageIndex: number, pageSize: number, search: string) {
    if (pageIndex === this.pageIndex && pageSize === this.pageSize && search === this.searchText) {
      return;
    }
    this.logsService.getPage(pageIndex + 1, pageSize, search)
      .subscribe(response => {
        this.pageSize = pageSize;
        this.pageIndex = pageIndex;
        this.searchText = search;
        this.data = response.data;
        this.totalItems = response.total;
        this.updateQueryPrams();
        this.loadSelected();
      });
  }
  loadSelected() {
    if (!this.selectedId || this.selectedId < 1) {
      // did we try to search for an error id?
      if (!/^\d+$/.test(this.searchText)) return;
      if (this.pageIndex !== 0) return;
      this.selectedId = parseInt(this.searchText);
    };
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
    this.loadData(event.pageIndex, event.pageSize, this.searchText);
  }
  getNext(id: number | undefined, offset: number) {
    let index = -1;
    if (id !== undefined) {
      index = this.data.findIndex(item => item.id === id);
    }
    index += offset;
    if (index < 0) index = this.data.length - 1;
    if (index >= this.data.length) index = 0;
    const item = this.data[index];
    this.selectedId = item.id;
    this.updateQueryPrams();
    return item;
  }
  onRowClick(item: LogData) {
    if (this.isDialogOpen) return;
    this.isDialogOpen = true;
    const config = new MatDialogConfig<LogComponentData>();
    config.data = { item, search: this.searchText };
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
    const dialogRef = this.dialog.open<LogComponent, LogComponentData>(LogComponent, config);
    dialogRef.componentInstance.nextItemEvent.subscribe(event => {
      event.setLog(this.getNext(event.id, 1));
    });
    dialogRef.componentInstance.priorItemEvent.subscribe(event => {
      event.setLog(this.getNext(event.id, -1));
    });
    dialogRef.afterClosed().subscribe(() => {
      this.isDialogOpen = false;
      this.selectedId = undefined;
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
  editSettings() {
    const config = new MatDialogConfig<CredentialsData>();
    config.data = { username: "foo" };
    config.disableClose = false;
    config.hasBackdrop = true;
    config.minWidth = "50%";
    config.maxWidth = "90%";
    config.width = "1000px";
    config.minHeight = "50%";
    config.maxHeight = "90%";
    config.height = "1000px";

    const dialogRef = this.dialog.open<CredentialsComponent, CredentialsData, CredentialsData>(CredentialsComponent, config);
    dialogRef.afterClosed().subscribe(data => {
      // foo
    });
  }
}

export class LogsModule { };