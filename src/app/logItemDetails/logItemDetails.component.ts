/* eslint-disable no-console */
import { Component, OnInit, Input, ViewChild, Inject } from '@angular/core';
import { NgFor, CommonModule } from '@angular/common';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { LogItemDetailsService } from './logItemDetails.service';
import { LogItemDetailData } from './LogItemDetailData';
import { highlightSearchTerms } from '../search/highlightSearchTerms';
import { Notice } from '../Notice';

@Component({
  selector: 'log-item-details',
  templateUrl: './logItemDetails.component.html',
  styleUrls: ['./logItemDetails.component.scss'],
  imports: [
    MatPaginatorModule,
    NgFor,
    CommonModule,
    MatProgressSpinnerModule
  ],
  standalone: true
})
export class LogItemDetailsComponent implements OnInit {
  @Input() id!: string;
  @Input() search!: string;
  @ViewChild('paginator') paginator!: MatPaginator
  pageSizeOptions = [5, 10, 25, 50, 100];
  totalItems: number = 0;
  pageSize: number = 10;
  pageIndex: number = 0;
  data: LogItemDetailData[] = [];
  waiting: boolean = false;
  notice: Notice;

  constructor(
    private logItemDetailsService: LogItemDetailsService,
    @Inject(MatSnackBar) private snackBar: MatSnackBar,
  ) {
    this.notice = new Notice(snackBar);
  }
  hasData() {
    return this.totalItems !== 0;
  }
  ngOnInit() {
    this.loadData(this.pageIndex, this.pageSize);
  }

  loadData(pageIndex: number, pageSize: number) {
    this.waiting = true;
    this.logItemDetailsService.getPage(this.id, pageIndex + 1, pageSize)
      .subscribe({
        next: response => {
          this.pageSize = pageSize;
          this.pageIndex = pageIndex;
          this.data = response.data;
          this.totalItems = response.total;
        }, error: (error: Error) => {
          this.notice.error(error.message);
          this.waiting = false;
        }, complete: () => {
          this.waiting = false;
        }
      });
  }
  handlePageEvent(event: PageEvent) {
    this.loadData(event.pageIndex, event.pageSize);
  }
  showPagnator() {
    return (this.totalItems / this.pageSize) > 1;
  }
  searchParts(text: string) {
    return highlightSearchTerms(text, this.search);
  }
}
