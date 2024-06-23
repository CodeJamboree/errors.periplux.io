/* eslint-disable no-console */
import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { NgFor, CommonModule } from '@angular/common';
import { LogDetailsService } from './logDetails.service';
import { LogDetailData } from './LogDetailData';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-log-details',
  templateUrl: './logDetails.component.html',
  styleUrls: ['./logDetails.component.scss'],
  imports: [MatPaginatorModule, NgFor, CommonModule],
  standalone: true
})
export class LogDetailsComponent implements OnInit {
  @Input() id!: string;
  @ViewChild('paginator') paginator!: MatPaginator
  pageSizeOptions = [5, 10, 25, 50, 100];
  totalItems: number = 0;
  pageSize: number = 10;
  pageIndex: number = 0;
  data: LogDetailData[] = [];

  constructor(private logDetailsService: LogDetailsService) {
  }

  ngOnInit() {
    this.loadData(this.pageIndex, this.pageSize);
  }

  loadData(pageIndex: number, pageSize: number) {
    this.logDetailsService.getPage(this.id, pageIndex + 1, pageSize)
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
}
