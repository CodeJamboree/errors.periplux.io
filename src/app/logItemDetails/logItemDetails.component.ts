/* eslint-disable no-console */
import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { NgFor, CommonModule } from '@angular/common';
import { LogItemDetailsService } from './logItemDetails.service';
import { LogItemDetailData } from './LogItemDetailData';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { highlightSearchTerms } from '../search/highlightSearchTerms';

@Component({
  selector: 'log-item-details',
  templateUrl: './logItemDetails.component.html',
  styleUrls: ['./logItemDetails.component.scss'],
  imports: [MatPaginatorModule, NgFor, CommonModule],
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

  constructor(private logItemDetailsService: LogItemDetailsService) {
  }
  hasData() {
    return this.totalItems !== 0;
  }
  ngOnInit() {
    this.loadData(this.pageIndex, this.pageSize);
  }

  loadData(pageIndex: number, pageSize: number) {
    this.logItemDetailsService.getPage(this.id, pageIndex + 1, pageSize)
      .subscribe(response => {
        this.pageSize = pageSize;
        this.pageIndex = pageIndex;
        this.data = response.data;
        this.totalItems = response.total;
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
