/* eslint-disable no-console */
import { Component, OnInit, Input, ViewChild, Inject } from '@angular/core';
import { NgFor, CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';

import { LogItemDatesService } from './logItemDates.service';
import { LogItemDateData } from './LogItemDateData';
import { DurationPipe } from '../pipes/DurationPipe';
import { graphDates } from './utils/graphDates';
import { Notice } from '../Notice';

@Component({
  selector: 'log-item-dates',
  templateUrl: './logItemDates.component.html',
  styleUrls: ['./logItemDates.component.scss'],
  imports: [
    MatPaginatorModule,
    NgFor,
    CommonModule,
    DurationPipe,
    MatProgressSpinnerModule
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
  waiting: boolean = false;
  notice: Notice;

  constructor(
    private logItemDatesService: LogItemDatesService,
    @Inject(MatSnackBar) private snackBar: MatSnackBar,
  ) {
    this.notice = new Notice(snackBar);
  }

  ngOnInit() {
    this.loadData(this.pageIndex, this.pageSize);
  }
  showPagnator() {
    return (this.totalItems / this.pageSize) > 1;
  }

  loadData(pageIndex: number, pageSize: number) {
    this.waiting = true;
    this.logItemDatesService.getPage(this.id, pageIndex + 1, pageSize)
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
}
