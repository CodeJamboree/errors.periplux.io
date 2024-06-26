/* eslint-disable no-console */
import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { NgFor, CommonModule } from '@angular/common';
import { LogItemDatesService } from './logItemDates.service';
import { LogItemDateData } from './LogItemDateData';
import { DurationPipe } from '../pipes/DurationPipe';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { graphDates } from './utils/graphDates';

@Component({
  selector: 'log-item-dates',
  templateUrl: './logItemDates.component.html',
  styleUrls: ['./logItemDates.component.scss'],
  imports: [
    MatPaginatorModule,
    NgFor,
    CommonModule,
    DurationPipe
  ],
  standalone: true
})
export class LogItemDatesComponent implements OnInit {
  @Input() id!: string;
  @ViewChild('paginator') paginator!: MatPaginator
  pageSizeOptions = [5, 10, 25, 50, 100];
  totalItems: number = 0;
  pageSize: number = 10;
  pageIndex: number = 0;
  data: LogItemDateData[] = [];
  graphDates = graphDates;

  constructor(private logItemDatesService: LogItemDatesService) {
  }

  ngOnInit() {
    this.loadData(this.pageIndex, this.pageSize);
  }
  showPagnator() {
    return (this.totalItems / this.pageSize) > 1;
  }

  loadData(pageIndex: number, pageSize: number) {
    this.logItemDatesService.getPage(this.id, pageIndex + 1, pageSize)
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
