/* eslint-disable no-console */
import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { NgFor, CommonModule } from '@angular/common';
import { LogDatesService } from './logDates.service';
import { LogDateData } from './LogDateData';
import { DurationPipe } from './DurationPipe';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { graphDates } from './graphDates';

@Component({
  selector: 'app-log-dates',
  templateUrl: './logDates.component.html',
  styleUrls: ['./logDates.component.scss'],
  imports: [
    MatPaginatorModule,
    NgFor,
    CommonModule,
    DurationPipe
  ],
  standalone: true
})
export class LogDatesComponent implements OnInit {
  @Input() id!: string;
  @ViewChild('paginator') paginator!: MatPaginator
  pageSizeOptions = [5, 10, 25, 50, 100];
  totalItems: number = 0;
  pageSize: number = 10;
  pageIndex: number = 0;
  data: LogDateData[] = [];
  graphDates = graphDates;

  constructor(private logDatesService: LogDatesService) {
  }

  ngOnInit() {
    this.loadData(this.pageIndex, this.pageSize);
  }
  showPagnator() {
    return (this.totalItems / this.pageSize) > 1;
  }

  loadData(pageIndex: number, pageSize: number) {
    this.logDatesService.getPage(this.id, pageIndex + 1, pageSize)
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
}
